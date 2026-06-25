import { useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import { Cardinality, ObjectType, Tab } from "../../data/constants";
import { calcPath } from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";

const labelFontSize = 16;
const cardinalityOffset = 28;

const INITIAL_GEOMETRY = {
  pathMeasured: false,
  labelX: 0,
  labelY: 0,
  labelWidth: 0,
  labelHeight: 0,
  cardinalityStartX: 0,
  cardinalityStartY: 0,
  cardinalityEndX: 0,
  cardinalityEndY: 0,
};

export default function Relationship({ data }) {
  const { settings } = useSettings();
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  const pathValues = useMemo(() => {
    const startTable = tables.find((t) => t.id === data.startTableId);
    const endTable = tables.find((t) => t.id === data.endTableId);

    if (!startTable || !endTable) return null;

    return {
      startFieldIndex: startTable.fields.findIndex((f) => f.id === data.startFieldId),
      endFieldIndex: endTable.fields.findIndex((f) => f.id === data.endFieldId),
      startTable: {
        x: startTable.x,
        y: startTable.y,
        comment: startTable.comment,
      },
      endTable: { x: endTable.x, y: endTable.y, comment: endTable.comment },
    };
  }, [tables, data]);

  // The single source of truth for the rendered path. Both the visible and the
  // wider invisible hover paths render this string, and the layout effect below
  // re-measures whenever it (or its label inputs) change.
  const pathD = useMemo(
    () => calcPath(pathValues, settings.tableWidth, 1, settings.showComments),
    [pathValues, settings.tableWidth, settings.showComments],
  );

  const pathRef = useRef();
  const labelRef = useRef();

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (data.cardinality) {
    // the translated values are to ensure backwards compatibility
    case t(Cardinality.MANY_TO_ONE):
    case Cardinality.MANY_TO_ONE:
      cardinalityStart = data.manyLabel || "n";
      cardinalityEnd = "1";
      break;
    case t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      cardinalityStart = "1";
      cardinalityEnd = data.manyLabel || "n";
      break;
    case t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      cardinalityStart = "1";
      cardinalityEnd = "1";
      break;
    default:
      break;
  }

  // Geometry that depends on the committed SVG (path length, sampled points and
  // the label's measured box) is computed AFTER render in a layout effect and
  // stored here, then rendered from state. Reading refs during render is impure
  // -- on first render `.current` is null so positions would be (0,0) until an
  // incidental re-render. Measuring post-commit fixes that latent bug while
  // keeping settled positions identical to the old render-time math.
  const [geometry, setGeometry] = useState(INITIAL_GEOMETRY);

  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) {
      setGeometry((prev) => (prev.pathMeasured ? INITIAL_GEOMETRY : prev));
      return;
    }

    const labelBBox = settings.showRelationshipLabels ? labelRef.current?.getBBox() : null;
    const labelWidth = labelBBox?.width ?? 0;
    const labelHeight = labelBBox?.height ?? 0;

    const pathLength = pathEl.getTotalLength();
    const labelPoint = pathEl.getPointAtLength(pathLength / 2);
    const startPoint = pathEl.getPointAtLength(cardinalityOffset);
    const endPoint = pathEl.getPointAtLength(pathLength - cardinalityOffset);

    const next = {
      pathMeasured: true,
      labelWidth,
      labelHeight,
      labelX: labelPoint.x - labelWidth / 2,
      labelY: labelPoint.y + labelHeight / 2,
      cardinalityStartX: startPoint.x,
      cardinalityStartY: startPoint.y,
      cardinalityEndX: endPoint.x,
      cardinalityEndY: endPoint.y,
    };

    // Only update when something actually moved, so the effect can't loop.
    setGeometry((prev) => {
      for (const key of Object.keys(next)) {
        if (prev[key] !== next[key]) return next;
      }
      return prev;
    });
  }, [pathD, settings.showRelationshipLabels, settings.showCardinality, data.name]);

  const {
    pathMeasured,
    labelX,
    labelY,
    cardinalityStartX,
    cardinalityStartY,
    cardinalityEndX,
    cardinalityEndY,
  } = geometry;

  const edit = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.RELATIONSHIPS,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document.getElementById(`scroll_ref_${data.id}`).scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <g className="select-none group" onDoubleClick={edit}>
        {/* invisible wider path for better hover ux */}
        <path d={pathD} fill="none" stroke="transparent" strokeWidth={12} cursor="pointer" />
        <path ref={pathRef} d={pathD} className="relationship-path" fill="none" cursor="pointer" />
        {settings.showRelationshipLabels && (
          <text
            x={labelX}
            y={labelY}
            fill={settings.mode === "dark" ? "lightgrey" : "#333"}
            fontSize={labelFontSize}
            fontWeight={500}
            ref={labelRef}
            className="group-hover:fill-sky-600"
          >
            {data.name}
          </text>
        )}
        {pathMeasured && settings.showCardinality && (
          <>
            <CardinalityLabel x={cardinalityStartX} y={cardinalityStartY} text={cardinalityStart} />
            <CardinalityLabel x={cardinalityEndX} y={cardinalityEndY} text={cardinalityEnd} />
          </>
        )}
      </g>
      <SideSheet
        title={t("edit")}
        size="small"
        visible={
          selectedElement.element === ObjectType.RELATIONSHIP &&
          selectedElement.id === data.id &&
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() => {
          setSelectedElement((prev) => ({
            ...prev,
            open: false,
          }));
        }}
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <RelationshipInfo data={data} />
        </div>
      </SideSheet>
    </>
  );
}

function CardinalityLabel({ x, y, text, r = 12, padding = 14 }) {
  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      setTextWidth(bbox.width);
    }
  }, [text]);

  return (
    <g>
      <rect
        x={x - textWidth / 2 - padding / 2}
        y={y - r}
        rx={r}
        ry={r}
        width={textWidth + padding}
        height={r * 2}
        fill="grey"
        className="group-hover:fill-sky-600"
      />
      <text
        ref={textRef}
        x={x}
        y={y}
        fill="white"
        strokeWidth="0.5"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {text}
      </text>
    </g>
  );
}
