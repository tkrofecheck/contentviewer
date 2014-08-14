// Shim for IE9 to allow console.log
if (!window.console) (function() {
  var __console, Console;
  Console = function() {
    var check = window.setInterval(function() {
      var f;
      if (window.console && console.log && !console.__buffer) {
        clearInterval(check);
        f = (Function.prototype.bind) ? Function.prototype.bind.call(console.log, console) : console.log;
        for (var i = 0; i < __console.__buffer.length; i++) f.apply(console, __console.__buffer[i]);
      }
    }, 1000);
    
    function log() {
      this.__buffer.push(arguments);
    }
    
    this.log = log;
    this.error = log;
    this.warn = log;
    this.info = log;
    this.__buffer = [];
  };
  __console = window.console = new Console();
})();
    

$(document).ready(function() {
  var lastScrollPosition = $(window).scrollTop();
  
  $myBook = $("#mybook");
  
  var contentviewer = {};
  
  contentviewer.create = function() {
    var book = {
      get_query_string: function(sVar){ // get parameter values in URL query string
        urlStr = window.location.search.substring(1);
        sv = urlStr.split("&");
        for (i=0;i< sv.length;i++) {
          ft = sv [i].split("=");
          if (ft[0] == sVar) {
            return ft[1];
          }
        }
      },//end get_query_string
      
      add_to_head: function(){
        var that = this;
        
        $('head').append('<script src="' + that.issueDir + '/config.js" type="text/javascript"></script>');
        $('head').append('<link rel="stylesheet" href="' + that.issueDir + '/styles.css" type="text/css" />');

        $(config).each(function(i, obj) {
          that.config = JSON.parse(JSON.stringify(obj));
          that.pageDir = that.issueDir + '/' + obj.bookPageFolder; //set pages directory
          that.num_pages = obj.bookPages.length;
          
          if (that.num_pages) {
            that.preload(obj.bookPages); //get images to preload from config and create pages
          } else {
            console.log("no pages found in config.js");
          }
        });
      }, //end add_to_head
      
      detect_device: function(){
        // Detect most common Tablets and Phones otherwise treat as standard web browser
        if (/iPad|iPhone/i.test(navigator.userAgent) ||                     /* iPad or iPhone */
            /(?:Silk|Kindle|KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA)/.test(navigator.userAgent) ||   /* Kindle Fire */
            /NOOK/.test(navigator.userAgent) ||                             /* Nook */
            /Android/.test(navigator.userAgent)                             /* Android */
           ) {
             this.isPhablet = true;
             setTimeout(function () {   window.scrollTo(0, 1); }, 1000);
             document.addEventListener("touchmove", function(evt) {
               evt.preventDefault();
             });
             document.addEventListener("load", function() {
                 setTimeout(hideURLbar, 0);
             }, false);
             function hideURLbar(){ window.scrollTo(0,1); }
           } else {
             this.isPhablet = false;
           }
      }, //end detect_device
      
      check_url: function(url){
        return /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i.test(url);
      },
      
      draw_book: function(){
        var that = this,
            config = this.config,
            $pageWidth,
            $pageHeight,
            $setPageWidth;
            
        $("#mybook div[title=page] img").each(function() {
          $pageWidth = $(this).width();
          $pageHeight = $(this).height();
          if (!$setPageWidth || $pageWidth > $setPageWidth) {
            $setPageWidth = $pageWidth;
            $setPageHeight = $pageHeight;
          }
        });
        
        $myBook.booklet({
          manual: false,
          width: $setPageWidth * 2, // width of 2 pages
          height: $setPageHeight,
          speed: config.pageFlipSpeed,
          manual: config.enableTapPageEdgeFlip,
          closed: true,
          autoCenter: config.autoCenterBook,
          pageNumbers: config.showPageNumbers,
          pagePadding: 0,
          overlays: true,
          tabs: config.showPrevNextButtons,
          arrows: false,
          nextControlText: config.nextButtonText,
          previousControlText: config.prevButtonText
        });
      }, //end draw_book
      
      colorbox: function(el) {
        $(el).nivoLightbox({
            effect: 'fadeScale',                             // The effect to use when showing the lightbox
            theme: 'default',                           // The lightbox theme to use
            keyboardNav: true,                          // Enable/Disable keyboard navigation (left/right/escape)
            clickOverlayToClose: true,                  // If false clicking the "close" button will be the only way to close the lightbox
            onInit: function(){},                       // Callback when lightbox has loaded
            beforeShowLightbox: function(){},           // Callback before the lightbox is shown
            afterShowLightbox: function(lightbox){},    // Callback after the lightbox is shown
            beforeHideLightbox: function(){},           // Callback before the lightbox is hidden
            afterHideLightbox: function(){},            // Callback after the lightbox is hidden
            onPrev: function(element){},                // Callback when the lightbox gallery goes to previous item
            onNext: function(element){},                // Callback when the lightbox gallery goes to next item
            errorMessage: 'The requested content cannot be loaded. Please try again later.' // Error message when content can't be loaded
        });
      },
      
      create_pages: function(newArrayOfImages){
        var that = this,
            imageId, $newDiv, $newImg, $newDivW, $newDivH;

        $.each(newArrayOfImages, function(i, item){
          imageId = null;
          $newDivW = null;
          $newDivH = null;
          $newDiv = $("<div></div>");
          $newImg = $("<img/>");
          $newAnchor = $("<a></a>");
          
          $newImg
            .attr({
              'src' : item.src,
              'width' : item.width,
              'height' : item.height
            });
            
          $newDiv
            .attr('title', 'page')
            .css({ 'width' : item.width, 'height' : item.height })
            .append($newImg);
            
            
          if (item.actionUrl) {
            $newAnchor
              .attr({
                "href" : (that.check_url(item.actionUrl)) ? item.actionUrl : that.pageDir + "/" + item.actionUrl
              })
              .on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(window).scrollTop(lastScrollPosition);
              })
              .append($newImg);
            
            that.colorbox($newAnchor);
            
            $newDiv.append($newAnchor);
          } else {
            $newDiv.append($newImg);
          }

          $myBook.append($newDiv);
        });
        
        this.draw_book();
      },
      
      preload: function(arrayOfImages){
        var that = this,
            windowW = $(window).width(),
            windowH = $(window).height(),
            aspectRatio = windowW / windowH,
            imageArray = new Array(),
            newSrc, imgObj, obj, c=0;
        
        $.each(arrayOfImages, function(i, item){
          newSrc = that.pageDir + '/' + item.image + "?t=" + new Date().getTime(),
          imgObj = $("<img/>");
          $(imgObj)
            .attr({ 'src' : newSrc, 'page' : item.page })
            .load(function() {
              obj = {};
              
              obj.actionUrl = item.actionUrl;
              obj.page = this.page;
              obj.src = this.src;
              obj.height = this.height;
              obj.width = this.width;

              obj.ar = this.width / this.height; //aspect ratio
              
              if (obj.ar < aspectRatio) {
                if (that.isPhablet) {
                  //alert(0);
                  obj.height = windowH - 100;
                  obj.width = parseInt((windowH - 100) * obj.ar);
                } else {
                  //alert(1);
                  obj.height = windowH - 112;
                  obj.width = parseInt((windowH - 112) * obj.ar);
                }
              } else {
                if (that.isPhablet) {
                  //alert(2);
                  obj.height = parseInt((windowW - 100) * obj.ar);
                  obj.width = (windowW - 30) / 2;
                } else {
                  //alert(3);
                  obj.height = parseInt((windowW - 10) * obj.ar);
                  obj.width = (windowW - 10) / 2;
                }
              }
              
              imageArray[i] = obj; //place pages in correct order
              
              c++;
              
              if (c == that.num_pages) {
                that.create_pages(imageArray);
              }
            });
        });
      }, //end preload
      
      refresh: function(){
        var that = this;
        
        $("#zoom").show();
        $("#zoom p").hide();
        $("#zoom li")
          .html(that.config.reloadPageText)
          .css({
            'color':'red',
            'top':'48px'
          });
            
        window.setTimeout(function() {
          window.location.reload(true);
        }, 1000);
      }, //end refresh
      
      resize: function(){
        var that = this;
        
        //confirm window was actually resized
        if($(window).height() != that.lastWindowHeight || $(window).width() != that.lastWindowWidth){
          that.lastWindowHeight = $(window).height();
          that.lastWindowWidth = $(window).width();

          window.setTimeout(that.refresh, 1000);
        }
      }, //end resize
      
      bind_drag: function(){
        var that = this,
            config = this.config;
        
        if (!this.isPhablet && config.enableDragging) {
          $("#mybook").draggable({
            scroll: true,
            cursor: "move"
          });
          console.log("bind drag");
        } else { return; }
      }, //end bind_drag
      
      unbind_drag: function(){
        var that = this,
            config = this.config;
        
        if (!this.isPhablet && config.enableDragging) {
          $("#mybook").draggable("destroy");
          console.log("unbind drag");
        } else { return; }
      }, //end unbind_drag
      
      draw_zoom: function(){
        var that = this,
            config = this.config;
            
        if (this.isPhablet || !that.config.enableZoom || window.lowIE) return;
        else {
          var html, $zoom, $zoomIn, $zoomOut;
        
          $zoom = $("<ul></ul>");
          $zoom.attr('id','zoom');
        
          $zoomIn = $("<li></li>");
          $zoomIn
            .attr('id','zoomIn')
            .html(''.concat(
              "<img src='images/spacer.gif' class='zoom-in left' width='1' height='1' align='left' border='0'/>",
              "<span class='text'>" + config.zoomInText + "</span>",
              "<img src='images/spacer.gif' class='zoom-in right' width='1' height='1' align='right' border='0'/>"
            ));
          $zoom.append($zoomIn);

          $zoomOut = $("<li></li>");
          $zoomOut
            .attr('id','zoomOut')
            .html(''.concat(
              "<img src='images/spacer.gif' class='zoom-out left' width='1' height='1' align='left' border='0'/>",
              "<span class='text'>" + config.zoomOutText + "</span>",
              "<img src='images/spacer.gif' class='zoom-out right' width='1' height='1' align='right' border='0'/>"
            ));
          $zoom.append($zoomOut);
          
          $("header").append($zoom);
          $zoomOut.hide();
          
          $zoomIn.click(function() {
            $(this).hide();
            $("#zoomOut").css('display','inline-block');
            $("#mybook").css({
              '-webkit-transform': 'scale(' + config.zoomLevel + ')',
              '-webkit-transition': 'all .5s linear',
              '-webkit-transform-style': 'preserve-3d',
              '-moz-transform': 'scale(' + config.zoomLevel + ')',
              '-moz-transition': 'transform 0.5s linear 0s',
              'transform': 'scale(' + config.zoomLevel + ')',
              'transition': 'all .5s linear'
            });
            window.setTimeout(that.unbind_drag(), 50);
            window.setTimeout(that.bind_drag(),100);
          });
            
          $zoomOut.click(function() {
            $(this).hide();
            $("#zoomIn").css('display','inline-block');
            $("#mybook").css({
              '-webkit-transform': 'scale(1)',
              '-webkit-transition': 'all .5s linear',
              '-webkit-transform-style': 'preserve-3d',
              '-moz-transform': 'scale(1)',
              'transform': 'scale(1)',
              'transition': 'all .5s linear'
            });
            window.setTimeout(that.unbind_drag(), 50);
            window.setTimeout(that.bind_drag(),100);
          });
        }
      },
      
      show_brand: function() {
        var that = this,
            config = this.config,
            html = ''.concat();
            
        $("#brand").hide();
        
        if (config.showBrandName) {
          html = html.concat(config.brandName);
          
          if (config.showMagazineTitle) {
            html = html.concat(" : " + config.magazineTitle);
          }
          
          $("#brand").html(html).show();
        } else {
          if (config.showMagazineTitle) {
            html = html.concat(config.magazineTitle);
            $("#brand").html(html).show();
          }
        }
      },
      
      show_subscribe: function() {
        var that = this,
            config = this.config;
        
        if (config.enableSubscribeButton) {
          $subButton = $("<a></a>");
          $subButton
            .attr({
              'href' : config.subscribeButtonUrl,
              'id' : 'subscribe'
            })
            .html(config.subscribeButtonText);
          
          //this.colorbox($subButton);
          $("header").append($subButton);
        }  
      },
      
      build: function() {
        var that = this;
        
        this.lastWindowHeight = $(window).height(); //window height
        this.lastWindowWidth = $(window).width(); //window width
        
        this.magId = this.get_query_string('magId'); //get magId in URL query string
        this.issueDate = this.get_query_string('issueDate'); //get issueDate in URL query string
        this.issueDir ='brands/' + this.magId + '/' + this.issueDate; //set issue directory using magId and issueDate in query string
        
        this.detect_device(); //detect if on tablet/phone
        
        this.add_to_head(); //add JS and CSS to head

        this.draw_zoom(); //show or hide zoom button
        this.bind_drag(); //enable / disable dragging of book
        
        this.show_brand(); //show or hide brand / magazine title on bottom left
        this.show_subscribe(); //show or hide subscribe link on top right

        $(window).resize(function(){ //on window resize, adjust DOM to new window
          that.resize();
        });
      } //end build
    };
    
    book.build();
  };
  
  contentviewer.create();
});