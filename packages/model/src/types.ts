import type { WallFamily } from "@axonbim/families";
import type { Vec3 } from "@axonbim/shared";

export type ProjectMeta = {
  format: "axon";
  formatVersion: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Storey = {
  id: string;
  name: string;
  elevation: number;
};

export type Wall = {
  id: string;
  storeyId: string;
  familyId: string;
  p1: Vec3;
  p2: Vec3;
  height: number;
  thickness: number;
};

export type AxonDocument = {
  meta: ProjectMeta;
  storeys: Storey[];
  families: WallFamily[];
  walls: Wall[];
};
