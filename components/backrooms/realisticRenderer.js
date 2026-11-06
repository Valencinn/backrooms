import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function createRealisticRenderer(renderer, scene, camera) {
  const compact = window.matchMedia("(max-width: 760px)").matches;
  const composer = new EffectComposer(renderer);
  const beauty = new RenderPass(scene, camera);
  // SSAOPass multiplica las sombras sobre readBuffer: necesita que la
  // escena ya esté dibujada, incluso cuando la oclusión está habilitada.
  composer.addPass(beauty);
  // La oclusión de contacto da peso a marcos, muebles y uniones del suelo.
  const occlusion = compact ? null : new SSAOPass(scene, camera, 1, 1, 12);
  if (occlusion) {
    occlusion.kernelRadius = 10;
    occlusion.minDistance = .001;
    occlusion.maxDistance = .12;
    composer.addPass(occlusion);
  }
  const output = new OutputPass();
  composer.addPass(output);
  return {
    resize(w, h) { composer.setSize(w, h); },
    render() { composer.render(); },
    dispose() { beauty.dispose(); occlusion?.dispose(); output.dispose(); composer.dispose(); },
  };
}
