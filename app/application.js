import Backbone from 'backbone';
import Mn from 'backbone.marionette';
import Tracks from './collections/tracks';
import Playlist from './models/playlist';
import Playlists from './collections/playlists';
import AppLayout from './views/app_layout';
import AppState from './models/appState';
import Radio from 'backbone.radio';
import Router from './routes/index';
import { syncFiles } from './libs/file';


require('./styles/app.styl');


let Application = Mn.Application.extend({

    _initChannel () { // Use Backbone.Radio instead of wreqr
        this.channelName = _.result(this, 'channelName') || 'global';
        this.channel = _.result(this, 'channel') || Radio.channel(this.channelName);
    },

    initialize () {
        this.appState = new AppState();
    },

    onBeforeStart () {
        this.allTracks = new Playlist({
            title: 'All Songs',
            tracks: new Tracks([], { type: 'all' })
        });
        this.allTracks.get('tracks').fetch();

        this.upNext = new Playlist({
            title: 'Up Next',
            tracks: new Tracks([], { type: 'upNext' })
        });

        this.search = new Playlist({
            title: 'Results for ',
            tracks: new Tracks([], { type: 'search' })
        });

        this.router = new Router();

        // the default playlist is all tracks
        this.appState.set('currentPlaylist', this.allTracks);

        this.allPlaylists = new Playlists();

        this.loadPlaylist = this.allPlaylists.fetch(); // Promise
    },

    onStart () {
        if (Backbone.history) {
            Backbone.history.start({pushState: false});
        }
        this.appLayout = new AppLayout();
        this.appLayout.render();
        syncFiles();

        // prevent the scroll with keyboard
        document.addEventListener('keydown', (e) => {
            let isScrollKey =  _.includes([32, 33, 34, 37, 38, 39, 40], e.which);
            if (isScrollKey && e.target == document.body) {
                e.preventDefault();
            }
        });
    }
});

export default new Application();
