export type ModelFormat = "glb" | "gltf" | "fbx" | "obj";

export type ImportedModel = {
  id: string;
  path: string;
  url: string;
  format: ModelFormat;
};

const modelModules = import.meta.glob(
  "../../../../assets/models/**/*.{glb,gltf,fbx,obj}",
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

const supportedFormat = /\.(glb|gltf|fbx|obj)$/i;

export const importedModels: ImportedModel[] = Object.entries(modelModules)
  .filter(([path]) => supportedFormat.test(path))
  .map(([path, url]) => ({
    id: path.split("/").pop()?.replace(supportedFormat, "") ?? path,
    path,
    url,
    format: path.split(".").pop()?.toLowerCase() as ModelFormat,
  }));

export function findModel(pathOrName: string) {
  const normalized = pathOrName.toLowerCase();
  return importedModels.find(
    (model) =>
      model.path.toLowerCase().endsWith(normalized) ||
      model.id.toLowerCase() === normalized.replace(supportedFormat, ""),
  );
}

export function getModelsInFolder(folder: "weapons" | "characters" | "maps" | "props") {
  return importedModels.filter((model) => model.path.includes(`/models/${folder}/`));
}
