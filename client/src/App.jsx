import React, { Component } from 'react';
import './App.css';
import Search from './components/Search.jsx';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';
import Masonry from 'react-masonry-component';

var ClipboardButton = require('react-clipboard.js');

const io = require('socket.io-client');
const socket = io.connect('/');

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

    this.clearLinks = this.clearLinks.bind(this);
    this.search = this.search.bind(this);
    this.handleSearchResponse = this.handleSearchResponse.bind(this);
    this.handleSearchResponseAfter = this.handleSearchResponseAfter.bind(this);
    this.handleSearchDBResponse = this.handleSearchDBResponse.bind(this);
    this.onImgLoadFailed = this.onImgLoadFailed.bind(this);
    this.onImgLoad = this.onImgLoad.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  clearLinks() {
    this.setState({links: [], after: '', nextAfter: ''});
  }

  getLinksFromCache() {
    console.log('here');
    const { links, linkCache } = this.state;
    if (links.length === 0) return;

//     let index = links[links.length - 1].id;

//     var fruits = ['Banana', 'Orange', 'Lemon', 'Apple', 'Mango'];
// var citrus = fruits.slice(1, 3);

// // fruits contains ['Banana', 'Orange', 'Lemon', 'Apple', 'Mango']
// // citrus contains ['Orange','Lemon']
    // console.log(links, linkCache);
    // links = [...arr1, ...arr2]
    // links.merge(linkCache.slice(links.length - 1, links.length + 24));

    for(var i = links.length; i < links.length + 20; i++) {
      if (links.findIndex((link) => { return link.id === linkCache[i].id; }) !== -1) return;

      links.push(linkCache[i]);
    }

    
    this.setState({links: links});

  }

  searchDB() {
    let searchDBData = {after: 0};
    socket.emit('search-db', searchDBData);
  }

  handleSearchDBResponse(newLinks) {
    const { links } = this.state;

    
    newLinks.forEach((newLink) => {
      
        document.getElementById('loadingText').style.display = 'none';

        // Don't let duplicates through
        if (links.findIndex((link) => { return link.url === newLink.url; }) !== -1) return;

        if (links.length > 25) return;

        links.push(newLink);
    });

    this.setState({linkCache: newLinks, links: links});
  }

  search(newSearchText, newSearchTime, newAfter) {
    return;

    // const { searchText, searchTime, after, nextAfter } = this.state;

    // if (newAfter === '' && newSearchText === searchText && newSearchTime === searchTime) newAfter = nextAfter;
    // if (newAfter === after && after !== '') return;

    // let searchData = {text: newSearchText, searchTime: newSearchTime, after: newAfter};

    // socket.emit('search', searchData);

    // this.setState({after: newAfter});
    // this.setState({searchText: newSearchText});
    // this.setState({searchTime: newSearchTime});

    // document.getElementById('loadingText').style.display = '';
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

    // document.body.scrollHeight <= document.body.clientHeight

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
    const { links, linkCache } = this.state;

    let failedURL = event.target.src.replace(/webm/i, 'gifv');

    // Filter the failed url out of links
    let linksUpdated = links.filter(function(link){
      return (link.url !== failedURL);
    });

    let linkCacheUpdated = linkCache.filter(function(link){
      return (link.url !== failedURL);
    });

    this.setState({ links: linksUpdated, linkCache: linkCacheUpdated });
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

  componentDidMount() {
    const { searchText, searchTime, nextAfter } = this.state;

    document.addEventListener("scroll", function(event) {
      if ( Math.round(this.getDocHeight() - 450) <= this.getScrollXY()[1] + window.innerHeight) {
        this.search(searchText, searchTime, nextAfter);
        this.getLinksFromCache();
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
        let newURL = link.url.replace(/gifv/i, 'webm');
        linkRows.push(
          <div className="linkDivChild" key={link.c_id+'-'+link.url}>
            <div className="copySuccessOverlay"><div className="copySuccessText">Copied!</div></div>
            <video src={newURL} style={imgStyle} type="video/webm" onError={this.onImgLoadFailed} data-cid={link.c_id} onLoadedMetadata={this.onImgLoad} autoPlay="true" loop="loop"/>
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
      'display': 'none'
    };

    return (
      <div id="AppWrapper" className="App">
        <div id="TopBar">
          <Search search={this.search} searchText={this.searchText} clearLinks={this.clearLinks}/>
        </div>    
        <Masonry className={"linkDiv"} options={{fitWidth: true, itemSelector: '.linkDivChild', gutter: 0, transitionDuration: '0.8s'}}>
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