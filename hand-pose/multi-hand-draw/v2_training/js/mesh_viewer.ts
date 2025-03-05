/**
 * @fileoverview This file contains a mesh viewer that allows for a simple
 * viewing of a mesh with an optional texture
 */

import {NormalizedLandmarkList} from 'google3/third_party/mediapipe/web/solutions/utils/transform_utils/landmark';
import * as THREE from 'three';

import * as util from './util';


/**
 * Configuration object for MeshViewerConfig
 */
export interface MeshViewerConfig extends util.ViewerWidgetConfig {
  materialColor?: number;
  texture?: string|null;
}

const DEFAULT_CONFIG: util.BaseRequired<MeshViewerConfig> = {
  materialColor: 0xffffff,
  texture: null,
};

/**
 * A viewer widget for meshes with or without textures
 */
export class MeshViewer extends util.ViewerWidget {
  protected override config!: Required<MeshViewerConfig>;
  private readonly light: THREE.PointLight;
  private readonly material: THREE.MeshLambertMaterial;
  private mesh?: THREE.Mesh;

  constructor(parent: HTMLElement, config: MeshViewerConfig = {}) {
    super(parent, {...DEFAULT_CONFIG, ...config});

    this.light = new THREE.PointLight(0xffffff, 1);
    this.light.position.copy(this.camera.position);
    this.scene.add(this.light);

    this.material = new THREE.MeshLambertMaterial(
        {color: this.config.materialColor, side: THREE.DoubleSide});
    if (this.config.texture) {
      this.setTexture(this.config.texture);
    }
  }

  protected override render() {
    this.light.position.copy(this.camera.position);
    super.render();
  }

  updateMeshFromLandmarks(
      landmarks: NormalizedLandmarkList, faces: ArrayLike<number>,
      textureCoords?: ArrayLike<number>) {
    const vectors: number[] = landmarks.reduce(
        (acc, cur) => acc.concat(cur.x, cur.y, cur.z), [] as number[]);
    this.updateMeshFromData(vectors, faces, textureCoords);
  }

  updateMeshFromData(
      points: ArrayLike<number>, faces: ArrayLike<number>,
      textureCoords?: ArrayLike<number>) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position', new THREE.BufferAttribute(new Float32Array(points), 3));
    geometry.setIndex(Array.from(faces));

    if (textureCoords) {
      geometry.setAttribute(
          'uv', new THREE.BufferAttribute(new Float32Array(textureCoords), 2));
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const center =
        geometry.boundingBox!.getCenter(new THREE.Vector3()).negate();
    geometry.translate(center.x, center.y, center.z);

    this.updateMesh(new THREE.Mesh(geometry, this.material));
  }

  updateMesh(mesh: THREE.Mesh) {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    this.scene.add(mesh);
    this.mesh = mesh;
    this.requestFrame();
  }

  setTexture(url: string) {
    const texture = new THREE.TextureLoader().load(url);
    this.material.setValues({map: texture});
  }
}

goog.exportSymbol('MeshViewer', MeshViewer);
