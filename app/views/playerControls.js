import Mn from 'backbone.marionette';
import application from '../application';


const Player = Mn.ItemView.extend({

    template: require('./templates/playerControls'),

    events: {
        'click #prev': 'prev',
        'click #play': 'toggle',
        'click #next': 'next',
    },

    modelEvents: {
        'change:currentTrack': 'render'
    },

    initialize() {
        this.listenTo(application.channel, {
            'upnext:reset': this.reset,
            'player:next': this.next
        });
        this.listenTo(application.appState, 'change:currentTrack',
            function(appState, currentTrack) {
                if (currentTrack) {
                    this.load(currentTrack);
                }
            }
        );
        $(document).keyup((e) => {
            e.preventDefault();
            let audio = application.audio;
            let volume;
            switch (e.which) {
                case 32: // 'Space'
                    this.toggle();
                    break;
                case 39: // ArrowRight
                    this.next();
                    break;
                case 37: // ArrowLeft
                    this.prev();
                    break;
                case 38: // ArrowUp
                    volume = audio.volume + 0.1 > 1 ? 1 : audio.volume + 0.1;
                    audio.volume = volume;
                    application.appState.set('currentVolume', volume);
                    break;
                case 40: // ArrowDown
                    volume = audio.volume - 0.1 < 0 ? 0 : audio.volume - 0.1;
                    audio.volume = volume;
                    application.appState.set('currentVolume', volume);
                    break;
                case 77: // m
                    this.toggleVolume();
                    break;
            }
        });
        let audio = application.audio;
        audio.onended = () => { this.next() };
        audio.onerror = (e) => {
            let code = e.currentTarget.error.code;
            if (code != 4) {
                let notification = {
                    status: 'ko',
                    message: t('play error')
                }
                application.channel.request('notification', notification);
                this.reset();
            // When reseting the audio.src it shows an error.
            } else if (!audio.src.includes("NO_MUSIC")) {
                let notification = {
                    status: 'ko',
                    message: t('unsupported format')
                }
                application.channel.request('notification', notification);
                this.reset();
            }
        };
    },

    reset() {
        application.appState.set('currentTrack', undefined);
        let audio = application.audio;
        audio.pause();
        audio.currentTime = 0;
        audio.src = "NO_MUSIC";
        this.render();
    },

    load(track) {
        let self = this;
        track.getStream(function(url) {
            self.play(url);
        });
    },

    play(url) {
        let audio = application.audio;
        audio.src = url;
        audio.load();
        audio.play();
        this.render();
    },

    toggle() {
        let audio = application.audio;
        if (audio.paused && audio.src && !audio.src.contains("NO_MUSIC")) {
            audio.play();
        } else if (audio.src) {
            audio.pause();
        }
        this.render();
    },

    prev() {
        let upNext = application.upNext.get('tracks');
        let currentTrackID = application.appState.get('currentTrack').get('_id');
        let currentTrack = upNext.get(currentTrackID);
        let index = upNext.indexOf(currentTrack);
        let prev = upNext.at(index - 1)
        if (prev) {
            application.appState.set('currentTrack', prev);
        }
    },

    next() {
        let repeat = application.appState.get('repeat');
        let upNext = application.upNext.get('tracks');
        let currentTrackID = application.appState.get('currentTrack').get('_id');
        let currentTrack = upNext.get(currentTrackID);
        let index = upNext.indexOf(currentTrack) + 1;
        let next = upNext.at(index)
        if (repeat == 'track') {
            this.replayCurrent();
        } else if (next) {
            application.appState.set('currentTrack', next);
        } else if (repeat == 'playlist' && upNext.at(0)) {
            if (upNext.length == 1) {
                this.replayCurrent();
            }
            application.appState.set('currentTrack', upNext.at(0));
        } else {
            this.reset();
        }
    },

    replayCurrent() {
        let audio = application.audio;
        audio.currentTime = 0;
        audio.play();
        this.render();
    },

    serializeData() {
        return _.extend(
            {'isPlaying': !application.audio.paused },
            this.model.toJSON()
        );
    }
});

export default Player;
