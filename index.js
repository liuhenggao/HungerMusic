var EventCenter = {
    on: function(type, handler){
        $(document).on(type, handler)
    },
    fire: function(type, data){
        $(document).trigger(type, data)
    }
}

var Footer = {
    init: function () {
        this.$footer = $("footer")
        this.$ul = this.$footer.find("ul")
        this.$box = this.$footer.find(".box")
        this.$leftBtn = this.$footer.find(".icon-back")
        this.$rightBtn = this.$footer.find(".icon-next")
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
        this.renderFoot()
    },

    bind: function () {
        var _this = this
        $(window).resize(function () {
            _this.setStyle()
        })
        this.$leftBtn.on('click', function () {
            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemWidth)
            if (!_this.isToStart) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '+=' + itemWidth * rowCount
                }, 400, function () {
                    _this.isToEnd = false
                    _this.isToStart = false
                    _this.isAnimate = false
                    if (parseFloat(_this.$ul.css('left')) >= 0) {
                        _this.isToStart = true
                    }
                })
            }
        })

        this.$rightBtn.on('click', function () {
            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemWidth)
            if (!_this.isToEnd) {
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '-=' + itemWidth * rowCount
                }, 400, function () {
                    _this.isToStart = false
                    _this.isToEnd = false
                    _this.isAnimate = false
                    if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
                        _this.isToEnd = true
                    }
                })
            }
        })

        this.$footer.on('click', 'li', function(){
            $(this).addClass('active')
            .siblings().removeClass('active')
            EventCenter.fire('select-albumn', {
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')})
        })
    },

    render: function () {
        var _this = this
        $.getJSON("http://api.jirengu.com/fm/getChannels.php")
            .done(function (ret) {
                console.log(ret)
                _this.renderFoot(ret.channels)
            }).fail(function () {
                console.log("error")
            })
    },

    renderFoot: function (channels) {
        var html = ''
        if (!channels) {
            return;
        }
        channels.forEach(function(channel){
            html += '<li class="item" data-channel-id="'+channel.channel_id+'" data-channel-name="'+channel.name+'">'
            + '<img src="'+channel.cover_small+'" alt="">'
            + '<span class="title">'+channel.name+'</span>'
            + '</li>'
        })
        this.$footer.find('ul').html(html)
        this.setStyle()
    },

    setStyle: function () {
        var count = this.$footer.find('li').length
        var width = this.$footer.find('li').outerWidth(true)
        this.$footer.find('ul').css({
            width: count * width + 'px'
        })
    }
}


var Fm = {
    init: function(){
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.loadMusic()
        this.bind()
    },

    bind: function(){
        var _this = this
        EventCenter.on('select-albumn', function(e, channelObj){
            _this.channelId = channelObj.channelId
            _this.channelName = channelObj.channelName
            _this.loadMusic()
            console.log('select ', channelObj)
        })

        this.$container.find('.btn-play').on('click', function(){
            var $btn = $(this)
            if($btn.hasClass('icon-kaishi')){
                $btn.removeClass('icon-kaishi').addClass('icon-pause')
                _this.audio.play()
            }else{
                $btn.removeClass('icon-pause').addClass('icon-kaishi')
                _this.audio.pause()
            }
        })

        this.$container.find('.btn-next').on('click', function(){
            _this.loadMusic(function(){
                _this.setMusic()
            })
        })

        this.audio.addEventListener('play', function(){
            clearInterval(_this.statusClock)
            _this.statusClock = setInterval(function(){
                _this.updateStatus()
            }, 1000)
        })

        this.audio.addEventListener('pause', function(){
            clearInterval(_this.statusClock)
        })

        this.$container.find('.bar').on('click', function(e){
            var percent = e.offsetX/$(this).width()
            _this.audio.currentTime = _this.audio.duration*percent
        })
    },

    loadMusic(callback){
        console.log('...loadMusic')
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php', {channel: 
        this.channelId}).done(function(ret){
            _this.song = ret['song'][0]
            _this.setMusic()
            _this.loadLyric()
        })
        var $btn = _this.$container.find('.btn-play')
            if($btn.hasClass('icon-kaishi')){
                $btn.removeClass('icon-kaishi').addClass('icon-pause')
            }
    },

    loadLyric(){
        console.log("...loadLyric")
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php', {sid: _this.song.sid}).done(function(ret){
                var lyric = ret.lyric
                var lyricObj = {}
                lyric.split('\n').forEach(function(line){
                    var times = line.match(/\d{2}:\d{2}/g)
                    var str = line.replace(/\[.+?\]/g, '')
                    if(Array.isArray(times)){
                        times.forEach(function(time){
                            lyricObj[time] = str
                        })
                    }
                })
                _this.lyricObj = lyricObj
            })

    },

    setMusic(){
        console.log('set music...')
        this.audio.src = this.song.url
        $('.bg').css('background-image', 'url('+this.song.picture+')')
        this.$container.find('.aside figure').css('background-image', 'url('+this.song.picture+')')
        this.$container.find('.detail .title').text(this.song.title)
        this.$container.find('.author').text(this.song.artist)
        this.$container.find('.detail .sign').text(this.channelName)
    },

    updateStatus(){
        var min = Math.floor(this.audio.currentTime/60)
        var second = Math.floor(this.audio.currentTime%60) + ''
        second = second.length === 2 ? second : '0' + second
        this.$container.find('.time').text(min + ':' + second)
        this.$container.find('.bar-progress').css('width', (this.audio.currentTime/this.audio.duration)*100 + '%')
        var line = this.lyricObj['0'+min+':'+second]
        this.$container.find('.lyric').text(line)
        console.log(this.lyricObj['0'+min+':'+second])
    }
}
Footer.init()
Fm.init()