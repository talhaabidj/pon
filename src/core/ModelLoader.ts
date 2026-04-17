/**
 * GLB/glTF loader with URL-level caching for repeated world props.
 */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Group } from 'three';

export class ModelLoader {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<Group>>();

  public async loadModel(url: string): Promise<Group> {
    const cached = this.cache.get(url);
    if (cached) {
      return (await cached).clone(true);
    }

    const promise = this.loader.loadAsync(url).then((gltf) => gltf.scene);
    this.cache.set(url, promise);

    return (await promise).clone(true);
  }

  public clear(): void {
    this.cache.clear();
  }
}
