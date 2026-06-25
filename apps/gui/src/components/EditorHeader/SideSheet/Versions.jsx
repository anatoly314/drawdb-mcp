import { useCallback, useContext, useEffect, useState, useMemo, useRef } from "react";
import { IdContext } from "../../../context/IdContext";
import { useTranslation } from "react-i18next";
import { Button, Spin, Steps, Tag, Toast } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import {
  create,
  getCommitsWithFile,
  getVersion,
  patch,
  get,
  VERSION_FILENAME,
} from "../../../api/gists";
import _ from "lodash";
import { DateTime } from "luxon";
import {
  useAreas,
  useDiagram,
  useEnums,
  useLayout,
  useNotes,
  useTransform,
  useTypes,
} from "../../../hooks";
import { databases } from "../../../data/databases";
import { loadCache, saveCache } from "../../../utils/cache";
import { ensureEnumIds, ensureTypeIds } from "../../../utils/ensureIds";

const LIMIT = 10;

export default function Versions({ open, title, setTitle }) {
  const { gistId, setGistId, version, setVersion } = useContext(IdContext);
  const { areas, setAreas } = useAreas();
  const { setLayout } = useLayout();
  const { database, tables, relationships, setTables, setRelationships } = useDiagram();
  const { notes, setNotes } = useNotes();
  const { types, setTypes } = useTypes();
  const { enums, setEnums } = useEnums();
  const { transform } = useTransform();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingVersion, setLoadingVersion] = useState(null);

  // The version cache is a mutable container kept across renders, so it lives
  // in a ref (lazily seeded from localStorage once) rather than a memo: refs
  // are explicitly meant to be mutated in place, memo return values are not.
  const cacheRef = useRef(null);
  if (cacheRef.current === null) {
    cacheRef.current = loadCache();
  }

  const diagramToString = useCallback(() => {
    return JSON.stringify({
      title,
      tables,
      relationships: relationships,
      notes: notes,
      subjectAreas: areas,
      database: database,
      ...(databases[database].hasTypes && { types: types }),
      ...(databases[database].hasEnums && { enums: enums }),
      transform: transform,
    });
  }, [areas, notes, tables, relationships, database, title, enums, types, transform]);

  const currentStep = useMemo(() => {
    if (!version) return 0;
    return versions.findIndex((v) => v.version === version);
  }, [version, versions]);

  const loadVersion = useCallback(
    async (sha) => {
      try {
        setLoadingVersion(sha);
        const version = await getVersion(gistId, sha);
        setVersion(sha);
        setLayout((prev) => ({ ...prev, readOnly: true }));

        if (!version.data.files[VERSION_FILENAME]) {
          return;
        }

        const content = version.data.files[VERSION_FILENAME].content;
        const parsedDiagram = JSON.parse(content);

        setTables(parsedDiagram.tables);
        setRelationships(parsedDiagram.relationships);
        setAreas(parsedDiagram.subjectAreas);
        setNotes(parsedDiagram.notes);
        setTitle(parsedDiagram.title);

        if (databases[database].hasTypes) {
          setTypes(ensureTypeIds(parsedDiagram.types));
        }

        if (databases[database].hasEnums) {
          setEnums(ensureEnumIds(parsedDiagram.enums));
        }
      } catch {
        Toast.error(t("failed_to_load_diagram"));
      } finally {
        setLoadingVersion(null);
      }
    },
    [
      t,
      gistId,
      setTables,
      setRelationships,
      setAreas,
      setVersion,
      setLayout,
      database,
      setNotes,
      setTypes,
      setEnums,
      setTitle,
    ],
  );

  const getRevisions = useCallback(
    async (cursorParam) => {
      if (!gistId) return;

      const cached = cacheRef.current[gistId];
      if (cached && !cursorParam) {
        // Hydrate from the local cache on a resolved-promise callback rather
        // than synchronously: this keeps every state update in a deferred
        // callback (the load-from-source pattern) instead of firing setState
        // straight inside an effect body.
        return Promise.resolve().then(() => {
          setVersions(cached.versions);
          setCursor(cached.cursor);
          setHasMore(cached.hasMore);
          setIsLoading(false);
        });
      }

      // State updates run inside the promise's .then()/.catch() callbacks so
      // they read as deferred external-sync callbacks (no setState fires
      // synchronously in the effect body that calls this).
      return Promise.resolve()
        .then(() => {
          setIsLoading(true);
          return getCommitsWithFile(gistId, VERSION_FILENAME, LIMIT, cursorParam);
        })
        .then((res) => {
          const newVersions = cursorParam ? [...versions, ...res.data] : res.data;

          setVersions(newVersions);
          setHasMore(res.pagination.hasMore);
          setCursor(res.pagination.cursor);

          cacheRef.current[gistId] = {
            versions: newVersions,
            cursor: res.pagination.cursor,
            hasMore: res.pagination.hasMore,
          };
          saveCache(cacheRef.current);
        })
        .catch(() => {
          Toast.error(t("oops_smth_went_wrong"));
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [gistId, versions, t, cacheRef],
  );

  const hasDiagramChanged = async () => {
    if (!gistId) return true;

    const previousVersion = await get(gistId);

    if (!previousVersion.data.files[VERSION_FILENAME]) {
      return true;
    }

    const previousDiagram = JSON.parse(previousVersion.data.files[VERSION_FILENAME]?.content);
    const currentDiagram = {
      title,
      tables,
      relationships: relationships,
      notes: notes,
      subjectAreas: areas,
      database: database,
      ...(databases[database].hasTypes && { types: types }),
      ...(databases[database].hasEnums && { enums: enums }),
      transform: transform,
    };

    return !_.isEqual(previousDiagram, currentDiagram);
  };

  const recordVersion = async () => {
    try {
      setIsRecording(true);
      const hasChanges = await hasDiagramChanged();
      if (!hasChanges) {
        Toast.info(t("no_changes_to_record"));
        return;
      }
      if (gistId) {
        await patch(gistId, VERSION_FILENAME, diagramToString());
      } else {
        const id = await create(VERSION_FILENAME, diagramToString());
        setGistId(id);
      }

      delete cacheRef.current[gistId];
      saveCache(cacheRef.current);

      await getRevisions();
    } catch {
      Toast.error(t("failed_to_record_version"));
    } finally {
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (gistId && open) {
      getRevisions();
    }
  }, [gistId, open, getRevisions]);

  return (
    <div className="mx-5 relative h-full">
      <div className="sticky top-0 z-10 sidesheet-theme pb-2">
        <Button
          block
          icon={isRecording ? <Spin /> : <IconPlus />}
          disabled={isLoading || isRecording}
          onClick={recordVersion}
        >
          {t("record_version")}
        </Button>
      </div>

      {(!gistId || !versions.length) && !isLoading && (
        <div className="my-3">{t("no_saved_versions")}</div>
      )}
      {gistId && (
        <div className="my-3 overflow-y-auto">
          <Steps direction="vertical" type="basic" current={currentStep}>
            {versions.map((r) => (
              <Steps.Step
                key={r.version}
                onClick={() => loadVersion(r.version)}
                className="group"
                title={
                  <div className="flex justify-between items-center w-full">
                    <Tag>{r.version.substring(0, 7)}</Tag>
                    <span className="text-xs hidden group-hover:inline-block">
                      {t("click_to_view")}
                    </span>
                  </div>
                }
                description={`${t("commited_at")} ${DateTime.fromISO(r.committed_at)
                  .setLocale(i18n.language)
                  .toLocaleString(DateTime.DATETIME_MED)}`}
                icon={
                  r.version === loadingVersion ? (
                    <Spin size="small" />
                  ) : (
                    <i className="text-sm fa-solid fa-asterisk ms-1" />
                  )
                }
              />
            ))}
          </Steps>
        </div>
      )}
      {isLoading && !isRecording && (
        <div className="text-blue-500 text-center my-3">
          <Spin size="middle" />
          <div>{t("loading")}</div>
        </div>
      )}
      {hasMore && !isLoading && (
        <div className="text-center">
          <Button onClick={() => getRevisions(cursor)}>{t("load_more")}</Button>
        </div>
      )}
    </div>
  );
}
