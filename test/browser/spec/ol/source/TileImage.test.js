import proj4 from 'proj4';
import {spy as sinonSpy} from 'sinon';
import ImageTile from '../../../../../src/ol/ImageTile.js';
import TileState from '../../../../../src/ol/TileState.js';
import {listen} from '../../../../../src/ol/events.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import {WORLD_EXTENT} from '../../../../../src/ol/proj/epsg3857.js';
import {register} from '../../../../../src/ol/proj/proj4.js';
import {
  addCommon,
  clearAllProjections,
  get as getProjection,
} from '../../../../../src/ol/proj.js';
import ReprojTile from '../../../../../src/ol/reproj/Tile.js';
import TileImage from '../../../../../src/ol/source/TileImage.js';
import {
  createForProjection,
  createXYZ,
} from '../../../../../src/ol/tilegrid.js';
import {createFromTemplate} from '../../../../../src/ol/tileurlfunction.js';
import {getUid} from '../../../../../src/ol/util.js';

describe('ol/source/TileImage', function () {
  function createSource(opt_proj, opt_tileGrid, opt_transition) {
    const proj = opt_proj || 'EPSG:3857';
    return new TileImage({
      projection: proj,
      tileGrid: opt_tileGrid || createForProjection(proj, undefined, [2, 2]),
      tileUrlFunction: createFromTemplate(
        'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
      ),
      transition: opt_transition,
    });
  }

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new TileImage({});
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new TileImage({interpolate: false});
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('#setTileGridForProjection', function () {
    it('uses the tilegrid for given projection', function () {
      const source = createSource();
      const tileGrid = createForProjection('EPSG:4326', 3, [10, 20]);
      source.setTileGridForProjection('EPSG:4326', tileGrid);
      const retrieved = source.getTileGridForProjection(
        getProjection('EPSG:4326'),
      );
      expect(retrieved).to.be(tileGrid);
    });
  });

  describe('#getTileInternal', function () {
    let source, tile;

    beforeEach(function () {
      source = createSource();
      expect(source.getKey()).to.be(getUid(source));
      tile = source.getTileInternal(0, 0, 0, 1, getProjection('EPSG:3857'));
    });

    describe('change a dynamic param', function () {
      describe('tile is not loaded', function () {
        it('returns a tile with the right key', function () {
          source.getKey = function () {
            return 'key0';
          };
          const returnedTile = source.getTileInternal(
            0,
            0,
            0,
            1,
            getProjection('EPSG:3857'),
          );
          expect(returnedTile).not.to.be(tile);
          expect(returnedTile.key).to.be('key0');
        });
      });
    });
  });

  describe('#getTile', function () {
    it('does not do reprojection for identity', function () {
      const source3857 = createSource('EPSG:3857');
      const tile3857 = source3857.getTile(
        0,
        0,
        0,
        1,
        getProjection('EPSG:3857'),
      );
      expect(tile3857).to.be.a(ImageTile);
      expect(tile3857).not.to.be.a(ReprojTile);

      const projXXX = new Projection({
        code: 'XXX',
        units: 'degrees',
      });
      const sourceXXX = createSource(projXXX);
      const tileXXX = sourceXXX.getTile(0, 0, 0, 1, projXXX);
      expect(tileXXX).to.be.a(ImageTile);
      expect(tileXXX).not.to.be.a(ReprojTile);
    });

    beforeEach(function () {
      proj4.defs('4326_noextentnounits', '+proj=longlat +datum=WGS84 +no_defs');
      register(proj4);
    });

    afterEach(function () {
      delete proj4.defs['4326_noextentnounits'];
      clearAllProjections();
      addCommon();
    });

    it('can handle source projection without extent and units', function (done) {
      const source = createSource(
        '4326_noextentnounits',
        createXYZ({
          extent: [-180, -90, 180, 90],
          tileSize: [2, 2],
        }),
      );
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      expect(tile).to.be.a(ReprojTile);

      listen(tile, 'change', function () {
        if (tile.getState() == 2) {
          // LOADED
          done();
        }
      });
      tile.load();
    });

    it('can handle target projection without extent and units', function (done) {
      const proj = getProjection('4326_noextentnounits');
      const source = createSource();
      source.setTileGridForProjection(
        proj,
        createXYZ({
          extent: WORLD_EXTENT,
          tileSize: [2, 2],
        }),
      );
      const tile = source.getTile(0, 0, 0, 1, proj);
      expect(tile).to.be.a(ReprojTile);

      listen(tile, 'change', function () {
        if (tile.getState() == 2) {
          // LOADED
          done();
        }
      });
      tile.load();
    });
  });

  describe('tile load events', function () {
    let source;

    beforeEach(function () {
      source = new TileImage({
        url: '{z}/{x}/{y}',
      });
    });

    it('dispatches tileloadstart and tileloadend events', function () {
      source.setTileLoadFunction(function (tile) {
        tile.setState(TileState.LOADED);
      });
      const startSpy = sinonSpy();
      source.on('tileloadstart', startSpy);
      const endSpy = sinonSpy();
      source.on('tileloadend', endSpy);
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      tile.load();
      expect(startSpy.callCount).to.be(1);
      expect(endSpy.callCount).to.be(1);
    });

    it('works for loading-error-loading-loaded sequences', function (done) {
      source.setTileLoadFunction(function (tile) {
        tile.setState(
          tile.state == TileState.ERROR ? TileState.LOADED : TileState.ERROR,
        );
      });
      const startSpy = sinonSpy();
      source.on('tileloadstart', startSpy);
      const errorSpy = sinonSpy();
      source.on('tileloaderror', function (e) {
        setTimeout(function () {
          e.tile.setState(TileState.LOADING);
          e.tile.setState(TileState.LOADED);
        }, 0);
        errorSpy();
      });
      source.on('tileloadend', function () {
        expect(startSpy.callCount).to.be(2);
        expect(errorSpy.callCount).to.be(1);
        done();
      });
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:3857'));
      tile.load();
    });
  });

  describe('transition option', function () {
    it('reproj tile transition should be same with source tile', function () {
      const transition = 0;
      const source = createSource('EPSG:3857', undefined, transition);
      const tile = source.getTile(0, 0, 0, 1, getProjection('EPSG:4326'));

      expect(tile).to.be.a(ReprojTile);
      expect(tile.transition_).to.be(transition);
    });
  });
});
