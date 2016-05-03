import Backbone from 'backbone';

const AppState = Backbone.Model.extend({

    // Store variable related to the current application State
    defaults: {
        currentTrack: '',
        currentPlaylist: '',
        repeat: 'false', // can be 'false' / 'track' / 'playlist'
        currentVolume: 0.5,
        mute: false
    },

    sync(method, model, options) {
        // prevent sync
    }
});

export default AppState;
