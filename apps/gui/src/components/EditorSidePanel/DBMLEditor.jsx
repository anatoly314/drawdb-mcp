import { useMemo } from "react";
import { useDiagram, useEnums, useLayout } from "../../hooks";
import { toDBML } from "../../utils/exportAs/dbml";
import { Button, Tooltip } from "@douyinfe/semi-ui";
import { IconTemplate } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import CodeEditor from "../CodeEditor";

export default function DBMLEditor() {
  const { tables: currentTables, relationships } = useDiagram();
  const { enums } = useEnums();
  const { setLayout } = useLayout();
  const { t } = useTranslation();

  // The editor is read-only, so its content is purely derived from the
  // diagram. Compute it during render instead of mirroring it into state via
  // an effect (which forced an extra render on every diagram change).
  const value = useMemo(
    () => toDBML({ tables: currentTables, enums, relationships }),
    [currentTables, enums, relationships],
  );

  const toggleDBMLEditor = () => {
    setLayout((prev) => ({ ...prev, dbmlEditor: !prev.dbmlEditor }));
  };

  return (
    <CodeEditor
      showCopyButton
      value={value}
      language="dbml"
      height="100%"
      options={{
        readOnly: true,
        minimap: { enabled: false },
      }}
      extraControls={
        <Tooltip content={t("tab_view")}>
          <Button icon={<IconTemplate />} onClick={toggleDBMLEditor} />
        </Tooltip>
      }
    />
  );
}
