import Backbone from 'backbone';
import application from '../application';

const AppState = Backbone.Model.extend({

    // Store variable related to the current application State
    defaults: {
        id: 'APP_STATE',
        currentTrack: undefined,
        currentPlaylist: '',
        shuffle: false,
        repeat: 'false', // can be 'false' / 'track' / 'playlist'
        currentVolume: 0.5,
        mute: false,

        // Used only to retrieve the last app_state
        currentTime: 0,
        upNext: '',
    },

    initialize () {
        this.fetch();
        let currentTrack = this.get('currentTrack');
        this.set('currentTrack', undefined);

        window.addEventListener('unload', this.save.bind(this));

        if (!(currentTrack && currentTrack._id)) return;
        application.loadTrack.then(() => {
            // Initialize currentTrack
            let id = currentTrack._id;
            let track = application.allTracks.get('tracks').get(id);
            this.set('currentTrack', track, {silent: true});
            application.channel.trigger('player:load', track);

            // Initialize upNext
            console.log(this.get('upNext'))
            let tracks = this.get('upNext');
            _.each(tracks, (t) => {
                let id = t._id;
                let track = application.allTracks.get('tracks').get(id);
                application.upNext.addTrack(track);
            });
        });
    },

    sync(method, model, options) {
        // Prevent Sync
    },

    // Retrieve data from the localStorage
    fetch() {
        var storage = window.localStorage;
        this.set(JSON.parse(storage.getItem(this.get('id'))));
    },

    // Save data from the localStorage
    save() {
        this.set('currentTime', application.audio.currentTime);
        this.set('upNext', application.upNext.get('tracks'));
        var storage = window.localStorage;
        let save = this.toJSON();
        delete save.currentPlaylist; // Don't save currentPlaylist
        storage.setItem(this.get('id'), JSON.stringify(save));
    }
});

export default AppState;
