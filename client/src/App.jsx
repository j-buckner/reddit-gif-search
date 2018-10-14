import React, { Component } from 'react';
import Search from './components/Search.jsx';
import Masonry from 'react-masonry-component';
import ReactDOM from 'react-dom';

import './App.css';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';

var ClipboardButton = require('react-clipboard.js');

var _ = require('underscore');

const io = require('socket.io-client');
const socket = io.connect('/');
const autoBind = require('auto-bind');

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      links: [],
      linkCache: [],
      after: '',
      nextAfter: '',
      searchText: 'all',
      searchTime: ''
    }

    autoBind(this);
  }

  clearLinks() {
    this.setState({links: [], after: '', nextAfter: ''});
  }

  getLinksFromCache() {
    const { links, linkCache } = this.state;

    if (links.length === 0) return;
    
    let newLinks = _.toArray(links);
    for (var i = links.length; i < links.length + 10; i++) {
      newLinks.push(linkCache[i]);
    }

    newLinks =  _.uniq(newLinks, 'url');

    this.setState({links: newLinks});
  }

  searchDB() {
    let searchDBData = {after: 0};
    socket.emit('search-db', searchDBData);
  }

  handleSearchDBResponse(newLinks) {
    const { links } = this.state;

    let numTargetColumns = Math.ceil(document.body.clientWidth / 430);
    let numTargetRows = Math.ceil(document.body.clientHeight / 250); // assume 250px average link height

    let numLinksToLoad = numTargetColumns * numTargetRows;

    newLinks.forEach((newLink) => {

        // Don't let duplicates through
        if (links.findIndex((link) => { return link.url === newLink.url; }) !== -1) return;

        if (links.length > numLinksToLoad) return;

        links.push(newLink);
    });

    this.setState({linkCache: newLinks, links: links});
  }

  search(newSearchText, newSearchTime, newAfter) {    
    const { searchText, searchTime, after, nextAfter } = this.state;

    if (newAfter === '' && newSearchText === searchText && newSearchTime === searchTime) newAfter = nextAfter;
    if (newAfter === after && after !== '') return;

    let searchData = {text: newSearchText, searchTime: newSearchTime, after: newAfter};

    socket.emit('search', searchData);

    this.setState({after: newAfter});
    this.setState({searchText: newSearchText});
    this.setState({searchTime: newSearchTime});

    document.getElementById('loadingText').style.display = '';
  }

  handleSearchResponse(newLinks) {
    const { searchText, searchTime, links } = this.state;

    newLinks.forEach((newLink) => {

      if (newLink.searchText !== searchText) return;
      if (newLink.searchTime !== searchTime) return;

      // Don't let duplicates through
      if (links.findIndex((link) => { return link.url === newLink.url; }) !== -1) return;

      document.getElementById('loadingText').style.display = 'none';
      links.push(newLink);
    });
    
    this.setState({links: links});
  }

  handleSearchResponseAfter(afterData) {
    const { links, searchText, searchTime } = this.state;

    let newAfter = afterData.nextAfter;
    if (afterData.searchText !== searchText) return;
    if (afterData.searchTime !== searchTime) return;

    // Set pagination - if the current page isn't filled call for next page now
    if (links.length < 10) {
      this.search(searchText, searchTime, newAfter);
      return;
    }

    this.setState({nextAfter: newAfter});
  }

  //below taken from http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
  getScrollXY() {
    var scrOfX = 0, scrOfY = 0;
    if( typeof( window.pageYOffset ) === 'number' ) {
      //Netscape compliant
      scrOfY = window.pageYOffset;
      scrOfX = window.pageXOffset;
    } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
      //DOM compliant
      scrOfY = document.body.scrollTop;
      scrOfX = document.body.scrollLeft;
    } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
      //IE6 standards compliant mode
      scrOfY = document.documentElement.scrollTop;
      scrOfX = document.documentElement.scrollLeft;
    }
    return [ scrOfX, scrOfY ];
  }

  //taken from http://james.padolsey.com/javascript/get-document-height-cross-browser/
  getDocHeight() {
    var D = document;
    return Math.max(
      D.body.scrollHeight, D.documentElement.scrollHeight,
      D.body.offsetHeight, D.documentElement.offsetHeight,
      D.body.clientHeight, D.documentElement.clientHeight
    );
  }

  onImgLoadFailed(event) {
    let { links, linkCache } = this.state;

    let failedUrl = event.target.src.replace(/mp4/i, 'gifv');

    // Filter the failed url out of links
    links = links.filter(function(link){
      return (link.url !== failedUrl);
    });

    linkCache = linkCache.filter(function(link){
      return (link.url !== failedUrl);
    });

    this.setState({ links: links, linkCache: linkCache });

    socket.emit('failed-url', failedUrl);
  }

  onImgLoad(event) {
    let imgWidth = 0;
    let imgHeight = 0;
    if (event.target.videoWidth && event.target.videoHeight) {
      imgWidth = event.target.videoWidth;
      imgHeight = event.target.videoHeight;
    } else {
      imgWidth = event.target.width;
      imgHeight = event.target.height;
    }

    if (imgWidth === 0) imgWidth = 350;
    if (imgHeight === 0) imgHeight = 350;

    let aspectRatio = imgWidth / imgHeight;

    let targetWidth = 430;
    let targetHeight = targetWidth / aspectRatio;

    if (event.target.videoWidth && event.target.videoHeight) {
      event.target.setAttribute('width', targetWidth);
      event.target.setAttribute('height', targetHeight);
    } else {
      event.target.width = targetWidth;
      event.target.height = targetHeight;
    }

  }

  handleCopyUrl(e) {
    let containerElement = e.trigger.parentElement.parentElement;
    let successBanner = containerElement.childNodes[0];
    
    // TODO: Optimize this so it looks good for all aspect ratios
    let height = containerElement.clientHeight - (containerElement.clientHeight * (0.90));
    
    successBanner.style.height = height + 'px';
    successBanner.style.bottom = '90%';

    setTimeout(function() {
      successBanner.style.height = '0px';
      successBanner.style.bottom = '100%';
    }, 2000);
  }

  handleImagesLoaded(mediaLoaded) {
    if (mediaLoaded.images.length === 0) return;
   
    document.getElementById('loadingText').style.display = 'none';
    ReactDOM.findDOMNode(this.refs.masonryDiv).style.display = '';
  }

  componentDidMount() {
    const { searchText, searchTime, nextAfter } = this.state;

    var getLinksFromCache = _.throttle(this.getLinksFromCache, 1000);

    document.addEventListener("scroll", function(event) {
      if ( Math.round(this.getDocHeight() - 450) <= this.getScrollXY()[1] + window.innerHeight) {
        this.search(searchText, searchTime, nextAfter);
        getLinksFromCache();
      }
    }.bind(this));

    this.searchDB();

    socket.on('search-response', this.handleSearchResponse);
    socket.on('search-response-db', this.handleSearchDBResponse);
    socket.on('search-after', this.handleSearchResponseAfter);
  }

  render() {
    const { links } = this.state;

    const imgStyle = {
      'marginBottom': '-5px',
      'display': 'block'
    }

    const linkRows = [];
    links.forEach(function(link, index) {
      if (!link.url) return;

      let type = link.url.includes('gifv') ? 'gifv' : 'gif';
      if (type === 'gifv'){
        let newURL = link.url.replace(/gifv/i, 'mp4');
        linkRows.push(
          <div className="linkDivChild" key={link.c_id+'-'+link.url}>
            <div className="copySuccessOverlay"><div className="copySuccessText">Copied!</div></div>
            <video src={newURL} style={imgStyle} type="video/mp4" onError={this.onImgLoadFailed} data-cid={link.c_id} onLoadedMetadata={this.onImgLoad} autoPlay="true" loop="loop"/>
            <div className="imgOverlay"><ClipboardButton onSuccess={this.handleCopyUrl} data-clipboard-text={link.url} className="copyUrl">Copy Url</ClipboardButton></div>
          </div>
        );
      } else {
        linkRows.push(
          <div className="linkDivChild" key={link.c_id+'-'+link.url}>
            <div className="copySuccessOverlay"><div className="copySuccessText">Copied!</div></div>
            <img data-cid={link.c_id} onLoad={this.onImgLoad} style={imgStyle} onError={this.onImgLoadFailed} src={link.url} alt=":("/>
            <div className="imgOverlay"><ClipboardButton onSuccess={this.handleCopyUrl} data-clipboard-text={link.url} className="copyUrl">Copy Url</ClipboardButton></div>
          </div>
        );
      }
    }.bind(this));

    const loadingStyle = {
      'display': ''
    };

    const masonryDivStyle = {
      'display': 'none'
    }

    return (
      <div id="AppWrapper" className="App">
        <div id="TopBar">
          <Search search={this.search} searchText={this.searchText} clearLinks={this.clearLinks}/>
        </div>    
        <Masonry
          ref={"masonryDiv"}
          className={"linkDiv"}
          style={masonryDivStyle}
          options={{fitWidth: true, itemSelector: '.linkDivChild', gutter: 0, transitionDuration: '0.8s'}}
          onImagesLoaded={this.handleImagesLoaded}
        >
          {linkRows}
        </Masonry>
        <div className="flex three">
          <div><span></span></div>
          <h3 id="loadingText" style={loadingStyle}>Loading...</h3>
          <div><span></span></div>
        </div>
      </div>
    );
  }
}

export default App;