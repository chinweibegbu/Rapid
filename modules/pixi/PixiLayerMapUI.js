import * as PIXI from 'pixi.js';
import { geoMetersToLon } from '@id-sdk/math';

import { AbstractLayer } from './AbstractLayer';


/**
 * PixiLayerMapUI
 * This class contains any UI elements to be 'drawn over' the map.
 * Some of these containers will contain data managed by other layers.
 *
 * - selected / hovered vertices and other elements
 * - geolocation aura
 * - tile debugging grid
 * - others?
 *
 * @class
 */
export class PixiLayerMapUI extends AbstractLayer {

  /**
   * @constructor
   * @param  scene    The Scene that owns this Layer
   * @param  layerID  Unique string to use for the name of this Layer
   */
  constructor(scene, layerID) {
    super(scene, layerID);

// todo: I'm adjusting the container nesting, this will need to be revisited
const container = new PIXI.Container();
container.name = layerID;
container.sortableChildren = true;
this.container = container;

const groupContainer = this.scene.groups.get('ui');
groupContainer.addChild(container);

    this._enabled = true;            // this layer should always be enabled
    this._oldk = 0;

    // setup the child containers
    // these only go visible if they have something to show

    // GEOLOCATION
    this._geolocationData = null;
    this._geolocationDirty = false;
    const geolocationContainer = new PIXI.Container();
    geolocationContainer.name = 'geolocation';
    geolocationContainer.buttonMode = false;
    geolocationContainer.interactive = false;
    geolocationContainer.interactiveChildren = false;
    geolocationContainer.sortableChildren = false;
    geolocationContainer.visible = false;
    this.geolocationContainer = geolocationContainer;

    // TILE DEBUGGING
    const tileDebugContainer = new PIXI.Container();
    tileDebugContainer.name = 'tile-debug';
    tileDebugContainer.buttonMode = false;
    tileDebugContainer.interactive = false;
    tileDebugContainer.interactiveChildren = false;
    tileDebugContainer.sortableChildren = false;
    tileDebugContainer.visible = false;
    this.tileDebugContainer = tileDebugContainer;

    // SELECTED
    const selectedContainer = new PIXI.Container();
    selectedContainer.name = 'selected';
    selectedContainer.sortableChildren = true;
    selectedContainer.visible = true;
    this.selectedContainer = selectedContainer;

    this.container.addChild(geolocationContainer, tileDebugContainer, selectedContainer);
  }


  /**
   * enabled
   * This layer should always be enabled - it contains important UI stuff
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(val) {
    // noop
  }


  /**
   * geolocationData
   * see:  https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPosition
   */
  get geolocationData() {
    return this._geolocationData;
  }
  set geolocationData(val) {
    this._geolocationData = val;
    this._geolocationDirty = true;
  }


  /**
   * render
   * Render any of the child containers for UI that should float over the map.
   * @param  frame        Integer frame being rendered
   * @param  projection   Pixi projection to use for rendering
   */
  render(frame, projection) {
    // redraw if zoom changes
    const k = projection.scale();
    if (k !== this._oldk) {
      this._geolocationDirty = true;
      this._oldk = k;
    }

    if (this._geolocationDirty) {
      this.renderGeolocation(frame, projection);
    }
  }


  /**
   * renderGeolocation
   * Render the geoloation data
   * @param  frame        Integer frame being rendered
   * @param  projection   Pixi projection to use for rendering
   */
  renderGeolocation(frame, projection) {
    if (this._geolocationDirty) {
      this._geolocationDirty = false;
      this.geolocationContainer.removeChildren();

      if (this.geolocationData && this.geolocationData.coords) {
        const d = this.geolocationData.coords;
        const coord = [d.longitude, d.latitude];
        const [x, y] = projection.project(coord);

        // Calculate the radius of the accuracy aura (convert meters -> pixels)
        const dLon = geoMetersToLon(d.accuracy, coord[1]);  // coord[1] = at this latitude
        const edge = [d.longitude + dLon, d.latitude];
        const x2 = projection.project(edge)[0];
        const r = Math.max(Math.abs(x2 - x), 15);
        const BLUE = 0xe60ff;

        const locatorAura = new PIXI.Graphics()
          .beginFill(BLUE, 0.4)
          .drawCircle(x, y, r)
          .endFill();
        locatorAura.name = 'aura';
        this.geolocationContainer.addChild(locatorAura);

        // Show a viewfield for the heading if we have it
        if (d.heading !== null && !isNaN(d.heading)) {
          const textures = this.context.pixi.rapidTextures;
          const locatorHeading = new PIXI.Sprite(textures.get('viewfieldDark'));
          locatorHeading.anchor.set(0.5, 1);  // middle, top
          locatorHeading.angle = d.heading;
          locatorHeading.name = 'heading';
          locatorHeading.position.set(x, y);
          this.geolocationContainer.addChild(locatorHeading);
        }

        const locatorPosition = new PIXI.Graphics()
          .lineStyle(1.5, 0xffffff, 1.0)
          .beginFill(BLUE, 1.0)
          .drawCircle(x, y, 6.5)
          .endFill();
        locatorPosition.name = 'position';
        this.geolocationContainer.addChild(locatorPosition);

        this.geolocationContainer.visible = true;

      } else {
        this.geolocationContainer.visible = false;
      }
    }
  }

}
