import Mn from 'backbone.marionette';
import application from '../application';
import { timeToString } from '../libs/utils';
import PopPlaylistView from './popupPlaylists'

const TrackView = Mn.LayoutView.extend({

    template: require('./templates/track'),

    tagName: 'li',

    ui: {
        'menu': '.menu',
        'popupMenu': '#popup-menu',
    },

    regions: {
        playlistPopup: '.playlist-popup-container',
    },

    events: {
        'click': 'play',
        'click @ui.menu': 'toggleMenu',
        'click .add-to-upnext':'addToUpNext',
        'mouseenter .add-to-playlist':'showPlaylistPopup',
        'mouseleave .add-to-playlist':'hidePlaylistPopup',
        'click .album-to-upnext':'albumToUpNext',
        'click .edit-details':'editDetails',
        'click .delete':'delete',
        'click .delete-from-upnext': 'removeFromUpNext',
        'click .remove-from-playlist': 'removeFromPlaylist',
        'mouseleave #popup-menu': 'hidePopupMenu',
    },

    modelEvents: {
        change: 'render'
    },

    initialize () {
        this.listenTo(application.appState, {
            'change:currentTrack': this.togglePlayingState,
            'change:currentPlaylist': this.setOrder,
        });

        // if the current track is added or removed from a playlist, run setPlaylist()
        this.listenTo(application.channel,'track:playlistChanged', (track) => {
            if (track && track.get('_id') == this.model.get('_id')) {
                this.setClass();
            }
        }, this);
    },

    onRender() {
        this.showChildView('playlistPopup', new PopPlaylistView({
            model: this.model,
            collection: application.allPlaylists
        }));
        this.setClass();
        this.togglePlayingState();
    },

    play(e) {
        application.channel.trigger('upnext:addCurrentPlaylist');
        application.appState.set('currentTrack', this.model);
    },

    toggleMenu(e) {
        e.stopPropagation();
        this.ui.popupMenu.toggleClass('show');
        this.ui.menu.toggleClass('active');
    },

    hidePopupMenu(e) {
        this.ui.popupMenu.removeClass('show');
        this.ui.menu.removeClass('active');
    },

    showPlaylistPopup(e) {
        application.channel.trigger('playlistPopup:show', this.model);
    },

    hidePlaylistPopup(e)  {
        application.channel.trigger('playlistPopup:hide', this.model);
    },

    // Add this model to upNext
    addToUpNext(e) {
        e.stopPropagation();
        application.upNext.addTrack(this.model);

        let notification = {
            status: 'ok',
            message: t('added to upnext')
        }
        application.channel.request('notification', notification);
    },

    // Remove this model from up next
    removeFromUpNext(e) {
        e.stopPropagation();
        if (this.model == application.appState.get('currentTrack')) {
            application.channel.trigger('player:next');
        }
        application.upNext.removeTrack(this.model);
    },

    // Remove the model from the current playlist
    removeFromPlaylist(e) {
        e.stopPropagation();
        application.appState.get('currentPlaylist').removeTrack(this.model);
    },

    // TO DO
    albumToUpNext(e) {
        e.stopPropagation();
    },

    // TO DO
    editDetails(e) {
        e.stopPropagation();
    },

    delete(e) {
        let item = this.model;
        item.set('hidden', true);
        item.save();
        e.stopPropagation();
    },

    setClass() {
        this.className = ''
        this.order = [];

        // Check if track is in upNext
        let tracks = application.upNext.get('tracks');
        let track = tracks.findWhere({ _id: this.model.get('_id') });
        if (track) {
            this.className += ' playlist-upNext';
            this.order.push({ id: 'upNext', order: tracks.indexOf(track) });
        }

        // Check if track is in search
        tracks = application.search.get('tracks');
        track = tracks.findWhere({ _id: this.model.get('_id') });
        if (track) {
            this.className += ' playlist-search';
        }

        // Check if track is in a playlist
        let playlists = application.allPlaylists;
        playlists.each((playlist) => {
            let tracks = playlist.get('tracks');
            let track = tracks.findWhere({ _id: this.model.get('_id') });
            if (track) {
                this.className += ' playlist-' + playlist.get('_id');
                this.order.push({ id: playlist.get('_id'), order: tracks.indexOf(track) });
            }
        });
        this.$el.get(0).className = this.className;
        this.setOrder();
    },

    serializeData() {
        let metas = this.model.get('metas');
        let currentPlaylist = application.appState.get('currentPlaylist');
        return _.extend( _.defaults({}, metas, {
            artist: '',
            album: '',
            number: '',
            type: currentPlaylist.get('tracks').type
        }), {
            duration: metas.duration? timeToString(metas.duration/1000):'--:--'
        });
    },

    setOrder() {
        let orderTrack = '';
        let currentPlaylist = application.appState.get('currentPlaylist');
        if (currentPlaylist.get('tracks').type == 'upNext') {
            if (this.$el.hasClass('playlist-upNext')) {
                let orderObj = this.order.find((o) => {
                    return o.id == 'upNext'
                });
                orderTrack = orderObj.order;
            }
        } else if (currentPlaylist.get('tracks').type == 'playlist') {
            let id = currentPlaylist.get('_id')
            if (this.$el.hasClass('playlist-' + id)) {
                let orderObj = this.order.find((o) => {
                    return o.id == id
                });
                orderTrack = orderObj.order;
            }
        }
        this.$el.get(0).style.order = orderTrack;
    },

    // Add the playling class if the current track is this model
    togglePlayingState() {
        let isPlayed;
        let currentTrack = application.appState.get('currentTrack');
        if (!currentTrack) {
            isPlayed = false;
        } else {
            isPlayed = currentTrack.get('_id') == this.model.get('_id');
        }
        this.$el.toggleClass('playing', isPlayed);
    },

});

export default TrackView;
