import Backbone from 'backbone';


const AppState = Backbone.Model.extend({

    // Store variable related to the current application State
    defaults: {
        id: 'APP_STATE',
        currentTrack: '',
        currentPlaylist: '',
        shuffle: false,
        repeat: 'false', // can be 'false' / 'track' / 'playlist'
        currentVolume: 0.5,
        mute: false
    },

    initialize () {
        this.fetch();
        this.on('change', this.debounceSave, this);
    },

    debounceSave: _.debounce(self => {
        self.save();
    }, 250),

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
        var storage = window.localStorage;
        let save = this.toJSON();
        delete save.currentPlaylist; // Don't save currentPlaylist
        delete save.currentTrack; //  Don't save Currentrack
        storage.setItem(this.get('id'), JSON.stringify(save));
    }
});

export default AppState;
