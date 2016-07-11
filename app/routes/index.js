import Backbone from 'backbone';
import application from '../application';
import PlaylistsRouter from './playlists';

let Router = Backbone.Router.extend({
    routes: {
        'tracks': 'tracks',
        'upnext': 'upnext',
        'search?q=:pattern': 'search',
        '': 'index'
    },

    initialize() {
        application.on('start', function() {
            let playlists = new PlaylistsRouter('playlists');
        });
    },

    index() {
        this.navigate('tracks', { trigger: true });
    },

    tracks() {
        application.appState.set('currentPlaylist', application.allTracks);
    },

    upnext() {
        application.appState.set('currentPlaylist', application.upNext);
    },

    // Search in the title, album and artist. Case unsensitive.
    search(pattern) {
        let models = application.allTracks.get('tracks').filter((item) => {
            let metas = _.defaults({}, item.get('metas'), {
                artist: '',
                album: ''
            });
            let search = new RegExp(pattern, 'i');
            return search.test(metas.title)
                || search.test(metas.album)
                || search.test(metas.artist);
        });
        application.search.set('title', 'Results for "' + pattern + '"');
        application.search.resetTrack(models);
        application.appState.set('currentPlaylist', application.search);
    }
});

export default Router;
