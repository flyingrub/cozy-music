import Mn from 'backbone.marionette';
import application from '../application';
import { timeToString } from '../libs/utils';


const Player = Mn.LayoutView.extend({

    template: require('./templates/player'),

    ui: {
        player: 'audio',
        currentTime: '#current-time',
        totalTime: '#total-time',
        progress: '#progress',
        progressBar: '#progress-bar',
        volume: '#volume',
        volumeBar: '#volume-bar',
        playButton: '#play',
        trackname: '#trackname',
        repeat: '#repeat',
        speaker: '#speaker'
    },

    events: {
        'click #prev': 'prev',
        'click #play': 'toggle',
        'click #next': 'next',
        'mousedown @ui.progressBar': 'skip',
        'mousedown @ui.volumeBar': 'changeVol',
        'click @ui.repeat': 'toggleRepeat',
        'click @ui.speaker': 'toggleVolume'
    },

    initialize() {
        this.listenTo(application.channel, {
            'upnext:reset': this.render,
            'player:next': this.next
        });
        this.listenTo(application.appState, 'change:currentTrack',
            function(appState, currentTrack) {
                if (currentTrack) {
                    this.load(currentTrack);
                }
        });

        // Allow keyboard event to manage the player
        $(document).keyup((e) => {
            e.preventDefault();
            let audio = this.ui.player.get(0);
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

        // Allow the seek through the volume and track progress
        $(document).mousemove((e) => {
            if (this.volumeDown) {
                this.changeVol(e);
            } else if (this.progressDown) {
                this.skip(e);
            }
        });
        $(document).mouseup((e) => {
            this.volumeDown = false;
            this.progressDown = false;
        });
    },

    onRender() {
        let audio = this.ui.player.get(0);
        audio.ontimeupdate = this.onTimeUpdate;
        audio.onended = () => { this.next() };
        audio.onvolumechange = this.onVolumeChange;
        audio.volume = application.appState.get('currentVolume');
    },

    load(track) {
        let title = track.get('metas').title;
        let artist = track.get('metas').artist;
        let text;
        if (artist) {
            text = artist + ' - ' + title;
        } else {
            text = title;
        }
        this.ui.trackname.text(text);
        let self = this;
        track.getStream(function(url) {
            self.play(url);
        });
    },

    play(url) {
        let audio = this.ui.player.get(0);
        audio.src = url;
        audio.load();
        audio.play();
        this.ui.playButton.find('use').attr(
            'xlink:href',
            require('../assets/icons/pause-lg.svg')
        );
    },

    toggle() {
        let audio = this.ui.player.get(0);
        if (audio.paused && audio.src) {
            audio.play();
            this.ui.playButton.find('use').attr(
                'xlink:href',
                require('../assets/icons/pause-lg.svg')
            );
        } else if (audio.src) {
            audio.pause();
            this.ui.playButton.find('use').attr(
                'xlink:href',
                require('../assets/icons/play-lg.svg')
            );
        }
    },

    prev() {
        let upNext = application.upNext.get('tracks');
        let currentTrack = application.appState.get('currentTrack');
        let index = upNext.indexOf(currentTrack);
        let prev = upNext.at(index - 1)
        if (prev) {
            application.appState.set('currentTrack', prev);
        }
    },

    next() {
        let repeat = application.appState.get('repeat');
        let upNext = application.upNext.get('tracks');
        let currentTrack = application.appState.get('currentTrack');
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
            application.appState.set('currentTrack', undefined);
            this.render();
        }
    },

    replayCurrent() {
        let audio = this.ui.player.get(0);
        audio.currentTime = 0;
        audio.play();
        this.ui.playButton.find('use').attr(
            'xlink:href',
            require('../assets/icons/pause-lg.svg')
        );
    },

    toggleRepeat() {
        let repeat = application.appState.get('repeat');
        switch (repeat) {
            case 'false':
                application.appState.set('repeat', 'track');
                this.ui.repeat.toggleClass('active', true);
                this.ui.repeat.find('use').attr(
                    'xlink:href',
                    require('../assets/icons/repeat-one-sm.svg')
                );
                break;
            case 'track':
                application.appState.set('repeat', 'playlist');
                this.ui.repeat.find('use').attr(
                    'xlink:href',
                    require('../assets/icons/repeat-sm.svg')
                );
                break;
            case 'playlist':
                application.appState.set('repeat', 'false');
                this.ui.repeat.toggleClass('active', false);
                break;
        }
    },

    toggleVolume() {
        let audio = this.ui.player.get(0);
        let mute = application.appState.get('mute');
        application.appState.set('mute', !mute);
        if (!mute) {
            audio.volume = 0;
        } else {
            audio.volume = application.appState.get('currentVolume');
        }
    },

    // Go to a certain time in the track
    skip(e) {
        this.progressDown = true;
        let audio = this.ui.player.get(0);
        let bar = this.ui.progressBar.get(0);
        let percent = (e.pageX - bar.offsetLeft) / bar.clientWidth;
        if (isFinite(audio.duration) && percent > 0 && percent < 1) {
            audio.currentTime = audio.duration * percent;
        }
    },

    // Change the time displayed
    onTimeUpdate() {
        let player = application.appLayout.getRegion('player').currentView;
        let audio = player.ui.player.get(0);
        player.ui.currentTime.html(timeToString(audio.currentTime));
        player.ui.totalTime.html(timeToString(audio.duration));
        let percent = audio.currentTime / audio.duration * 100 + '%';
        player.ui.progress.width(percent);
    },

    // Change the volume displayed
    onVolumeChange() {
        let player = application.appLayout.getRegion('player').currentView;
        let audio = player.ui.player.get(0);
        let bar = player.ui.volumeBar.get(0);
        let percent = audio.volume * 100 + '%';
        player.ui.volume.width(percent);
        if (audio.volume == 0) {
            player.ui.speaker.find('use').attr(
                'xlink:href',
                require('../assets/icons/mute-sm.svg')
            );
        } else {
            player.ui.speaker.find('use').attr(
                'xlink:href',
                require('../assets/icons/speaker-sm.svg')
            );
        }
    },

    // Change the volume
    changeVol(e) {
        this.volumeDown = true;
        let audio = this.ui.player.get(0);
        let bar = this.ui.volumeBar.get(0);
        let volume = (e.pageX - bar.offsetLeft) / bar.clientWidth;
        if (volume >= 0 && volume <= 1) {
            audio.volume = volume;
            application.appState.set('currentVolume', volume);
        }
    }
});

export default Player;
