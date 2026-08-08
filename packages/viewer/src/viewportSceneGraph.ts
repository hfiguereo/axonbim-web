import type { MeshBuffer } from "@axonbim/geometry";
import {
  AmbientLight,
  AxesHelper,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  GridHelper,
  Group,
  LineBasicMaterial,
  MeshLambertMaterial,
  Scene,
  SphereGeometry,
} from "three";
import { createPlanCropMaskMaterial } from "./viewCropClip.js";

export function meshFromBuffer(buffer: MeshBuffer): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(buffer.positions, 3));
  g.setAttribute("normal", new BufferAttribute(buffer.normals, 3));
  g.setIndex(new BufferAttribute(buffer.indices, 1));
  g.computeBoundingSphere();
  return g;
}

export type ViewportSceneGraph = {
  scene: Scene;
  sun: DirectionalLight;
  axes: AxesHelper;
  grid: GridHelper;
  wallsGroup: Group;
  doorsGroup: Group;
  windowsGroup: Group;
  camerasGroup: Group;
  cropGroup: Group;
  planDoorsGroup: Group;
  flipControlsGroup: Group;
  cropMaskGroup: Group;
  wallMat: MeshLambertMaterial;
  wallSelectedMat: MeshLambertMaterial;
  doorMat: MeshLambertMaterial;
  doorSelectedMat: MeshLambertMaterial;
  doorFrameMat: MeshLambertMaterial;
  doorFrameSelectedMat: MeshLambertMaterial;
  doorHardwareMat: MeshLambertMaterial;
  doorHardwareSelectedMat: MeshLambertMaterial;
  windowFrameMat: MeshLambertMaterial;
  windowFrameSelectedMat: MeshLambertMaterial;
  windowSashMat: MeshLambertMaterial;
  windowSashSelectedMat: MeshLambertMaterial;
  windowGlassMat: MeshLambertMaterial;
  windowGlassSelectedMat: MeshLambertMaterial;
  cameraLineMat: LineBasicMaterial;
  cameraLineSelectedMat: LineBasicMaterial;
  cameraConeSelectedMat: LineBasicMaterial;
  cropLineMat: LineBasicMaterial;
  cropLineSelectedMat: LineBasicMaterial;
  cropGripMat: MeshLambertMaterial;
  cameraPickGeom: SphereGeometry;
  cameraPickMat: MeshLambertMaterial;
  cameraPickSelectedMat: MeshLambertMaterial;
  planDoorLineMat: LineBasicMaterial;
  planDoorLineSelectedMat: LineBasicMaterial;
  flipSwingMat: MeshLambertMaterial;
  flipHingeMat: MeshLambertMaterial;
  flipSphereGeom: SphereGeometry;
  clipMats: Array<MeshLambertMaterial | LineBasicMaterial>;
  cropMaskMat: ReturnType<typeof createPlanCropMaskMaterial>;
  bgColor: number;
};

export function createViewportSceneGraph(background: string): ViewportSceneGraph {
  const scene = new Scene();
  scene.background = new Color(background);

  scene.add(new AmbientLight(0xffffff, 0.55));
  const sun = new DirectionalLight(0xfff2dd, 1.05);
  sun.position.set(6, -4, 12);
  scene.add(sun);

  const grid = new GridHelper(40, 40, 0x5a6a78, 0x2f3a44);
  grid.rotation.x = Math.PI / 2;
  scene.add(grid);
  const axes = new AxesHelper(1.5);
  scene.add(axes);

  const wallsGroup = new Group();
  scene.add(wallsGroup);

  const wallMat = new MeshLambertMaterial({
    color: 0xc4b49a,
    side: DoubleSide,
  });
  const wallSelectedMat = new MeshLambertMaterial({
    color: 0xd4a15a,
    side: DoubleSide,
    emissive: 0x3a2a10,
  });
  const doorMat = new MeshLambertMaterial({
    color: 0x8b5a2b,
    side: DoubleSide,
  });
  const doorSelectedMat = new MeshLambertMaterial({
    color: 0xc4783a,
    side: DoubleSide,
    emissive: 0x3a2010,
  });
  const doorFrameMat = new MeshLambertMaterial({
    color: 0x5c4030,
    side: DoubleSide,
  });
  const doorFrameSelectedMat = new MeshLambertMaterial({
    color: 0x7a5538,
    side: DoubleSide,
    emissive: 0x2a1808,
  });
  const doorHardwareMat = new MeshLambertMaterial({
    color: 0xb0b8c0,
    side: DoubleSide,
  });
  const doorHardwareSelectedMat = new MeshLambertMaterial({
    color: 0xd0d8e0,
    side: DoubleSide,
    emissive: 0x202428,
  });
  const doorsGroup = new Group();
  scene.add(doorsGroup);
  const windowsGroup = new Group();
  scene.add(windowsGroup);
  const camerasGroup = new Group();
  scene.add(camerasGroup);
  const cropGroup = new Group();
  scene.add(cropGroup);

  const cameraLineMat = new LineBasicMaterial({ color: 0xc8a45a });
  const cameraLineSelectedMat = new LineBasicMaterial({ color: 0xffd080 });
  const cameraConeSelectedMat = new LineBasicMaterial({ color: 0xe8c888 });
  const cropLineMat = new LineBasicMaterial({ color: 0x6ec6ff });
  const cropLineSelectedMat = new LineBasicMaterial({ color: 0xa8e0ff });
  const cropGripMat = new MeshLambertMaterial({
    color: 0x6ec6ff,
    emissive: 0x103040,
  });
  const cameraPickGeom = new SphereGeometry(1, 10, 8);
  const cameraPickMat = new MeshLambertMaterial({
    color: 0xc8a45a,
    transparent: true,
    opacity: 0.01,
    depthWrite: false,
  });
  const cameraPickSelectedMat = new MeshLambertMaterial({
    color: 0xffd080,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });

  const windowFrameMat = new MeshLambertMaterial({
    color: 0x6a7a88,
    side: DoubleSide,
  });
  const windowFrameSelectedMat = new MeshLambertMaterial({
    color: 0x8aa0b4,
    side: DoubleSide,
    emissive: 0x1a2838,
  });
  const windowSashMat = new MeshLambertMaterial({
    color: 0xe8eef4,
    side: DoubleSide,
  });
  const windowSashSelectedMat = new MeshLambertMaterial({
    color: 0xf5f8fc,
    side: DoubleSide,
    emissive: 0x203040,
  });
  const windowGlassMat = new MeshLambertMaterial({
    color: 0x7ec8e8,
    transparent: true,
    opacity: 0.35,
    side: DoubleSide,
  });
  const windowGlassSelectedMat = new MeshLambertMaterial({
    color: 0xa0d8f0,
    transparent: true,
    opacity: 0.45,
    side: DoubleSide,
    emissive: 0x102030,
  });

  const planDoorsGroup = new Group();
  scene.add(planDoorsGroup);
  const planDoorLineMat = new LineBasicMaterial({ color: 0x2a3340 });
  const planDoorLineSelectedMat = new LineBasicMaterial({ color: 0xd4a15a });
  const flipSwingMat = new MeshLambertMaterial({
    color: 0x3d8bfd,
    emissive: 0x1a3a6a,
  });
  const flipHingeMat = new MeshLambertMaterial({
    color: 0x7dd87d,
    emissive: 0x1a4a1a,
  });
  const flipSphereGeom = new SphereGeometry(1, 12, 10);
  const flipControlsGroup = new Group();
  scene.add(flipControlsGroup);

  const clipMats: Array<MeshLambertMaterial | LineBasicMaterial> = [
    wallMat,
    wallSelectedMat,
    doorMat,
    doorSelectedMat,
    doorFrameMat,
    doorFrameSelectedMat,
    doorHardwareMat,
    doorHardwareSelectedMat,
    windowFrameMat,
    windowFrameSelectedMat,
    windowSashMat,
    windowSashSelectedMat,
    windowGlassMat,
    windowGlassSelectedMat,
    planDoorLineMat,
    planDoorLineSelectedMat,
  ];

  const cropMaskGroup = new Group();
  scene.add(cropMaskGroup);
  const bgColor =
    scene.background instanceof Color ? scene.background.getHex() : 0x1c2228;
  const cropMaskMat = createPlanCropMaskMaterial(bgColor);

  return {
    scene,
    sun,
    axes,
    grid,
    wallsGroup,
    doorsGroup,
    windowsGroup,
    camerasGroup,
    cropGroup,
    planDoorsGroup,
    flipControlsGroup,
    cropMaskGroup,
    wallMat,
    wallSelectedMat,
    doorMat,
    doorSelectedMat,
    doorFrameMat,
    doorFrameSelectedMat,
    doorHardwareMat,
    doorHardwareSelectedMat,
    windowFrameMat,
    windowFrameSelectedMat,
    windowSashMat,
    windowSashSelectedMat,
    windowGlassMat,
    windowGlassSelectedMat,
    cameraLineMat,
    cameraLineSelectedMat,
    cameraConeSelectedMat,
    cropLineMat,
    cropLineSelectedMat,
    cropGripMat,
    cameraPickGeom,
    cameraPickMat,
    cameraPickSelectedMat,
    planDoorLineMat,
    planDoorLineSelectedMat,
    flipSwingMat,
    flipHingeMat,
    flipSphereGeom,
    clipMats,
    cropMaskMat,
    bgColor,
  };
}

export function disposeStaticSceneGraphResources(sg: ViewportSceneGraph): void {
  sg.grid.geometry.dispose();
  const gridMat = sg.grid.material;
  if (Array.isArray(gridMat)) gridMat.forEach((m) => m.dispose());
  else gridMat.dispose();
  sg.wallMat.dispose();
  sg.wallSelectedMat.dispose();
  sg.doorMat.dispose();
  sg.doorSelectedMat.dispose();
  sg.doorFrameMat.dispose();
  sg.doorFrameSelectedMat.dispose();
  sg.doorHardwareMat.dispose();
  sg.doorHardwareSelectedMat.dispose();
  sg.windowFrameMat.dispose();
  sg.windowFrameSelectedMat.dispose();
  sg.windowSashMat.dispose();
  sg.windowSashSelectedMat.dispose();
  sg.windowGlassMat.dispose();
  sg.windowGlassSelectedMat.dispose();
  sg.planDoorLineMat.dispose();
  sg.planDoorLineSelectedMat.dispose();
  sg.cameraLineMat.dispose();
  sg.cameraLineSelectedMat.dispose();
  sg.cameraConeSelectedMat.dispose();
  sg.cropLineMat.dispose();
  sg.cropLineSelectedMat.dispose();
  sg.cropGripMat.dispose();
  sg.cropMaskMat.dispose();
  sg.cameraPickMat.dispose();
  sg.cameraPickSelectedMat.dispose();
  sg.cameraPickGeom.dispose();
  sg.flipSwingMat.dispose();
  sg.flipHingeMat.dispose();
  sg.flipSphereGeom.dispose();
}
