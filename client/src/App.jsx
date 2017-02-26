import React, { Component } from 'react';
import './App.css';
import Search from './components/Search.jsx';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';
import Masonry from 'react-masonry-component';

const io = require('socket.io-client');
const socket = io.connect('/');

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      links: [],
      after: '',
      nextAfter: '',
      searchText: 'all',
      searchTime: ''
    }

    this.clearLinks = this.clearLinks.bind(this);
    this.search = this.search.bind(this);
    this.handleSearchResponse = this.handleSearchResponse.bind(this);
    this.handleSearchResponseAfter = this.handleSearchResponseAfter.bind(this);
    this.onImgLoadFailed = this.onImgLoadFailed.bind(this);
    this.onImgLoad = this.onImgLoad.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  clearLinks() {
    this.setState({links: [], after: '', nextAfter: ''});
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

  handleSearchResponseAfter(newAfter) {
    const { links, searchText, searchTime } = this.state;

    // Set pagination - if the current page isn't filled call for next page now
    if (links.length === 0) {
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
    const { links } = this.state;

    let failedURL = event.target.src.replace(/webm/i, 'gifv');

    // Filter the failed url out of links
    let linksUpdated = links.filter(function(link){
      return (link.url !== failedURL);
    });

    this.setState({ links: linksUpdated });
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

    let targetWidth = 415;
    let targetHeight = targetWidth / aspectRatio;

    if (event.target.videoWidth && event.target.videoHeight) {
      event.target.setAttribute('width', targetWidth);
      event.target.setAttribute('height', targetHeight);
    } else {
      event.target.width = targetWidth;
      event.target.height = targetHeight;
    }

    event.target.style.display = '';
  }

  componentDidMount() {
    // const { searchText, searchTime, nextAfter } = this.state;

    document.addEventListener("scroll", function(event) {
      if ( Math.round(this.getDocHeight() - 450) <= this.getScrollXY()[1] + window.innerHeight) {
        // this.search(searchText, searchTime, nextAfter);
      }
    }.bind(this));

    socket.on('search-response', this.handleSearchResponse);
    socket.on('search-after', this.handleSearchResponseAfter);
  }

  render() {
    const { links } = this.state;
    const imgStyle = {
      // 'pointerEvents': 'none'
    };

    const linkRows = [];
    links.forEach(function(link, index) {
      let imgDivStyle = {
// 
      };

      let type = link.url.includes('gifv') ? 'gifv' : 'gif';
      if (type === 'gifv'){
        let newURL = link.url.replace(/gifv/i, 'webm');
        linkRows.push(
          <div className="linkDivChild" key={link.c_id+'-'+link.url} style={imgDivStyle}>
            <video src={newURL} type="video/webm" onError={this.onImgLoadFailed} data-cid={link.c_id} onLoadedMetadata={this.onImgLoad} style={imgStyle} autoPlay="true" loop="loop"/>
          </div>
        );
      } else {
        linkRows.push(
          <div className="linkDivChild" key={link.c_id+'-'+link.url} style={imgDivStyle}>
            <img data-cid={link.c_id} onLoad={this.onImgLoad} style={imgStyle} onError={this.onImgLoadFailed} src={link.url} alt=":("/>
          </div>
        );
      }
    }.bind(this));

    const loadingStyle = {
      'display': 'none'
    };

    return (
      <div id="AppWrapper" className="App">
        <Search search={this.search} searchText={this.searchText} clearLinks={this.clearLinks}/>
        <div className='masonryDiv'>
          <Masonry
            className={'linkDiv'}
            disableImagesLoaded={false} // default false
            updateOnEachImageLoad={false} // default false and works only if disableImagesLoaded is false
          >
            {linkRows}
          </Masonry>
        </div>
        <div className="flex three">
          <div><span></span></div>
          <h4 id="loadingText" style={loadingStyle}>Loading...</h4>
          <div><span></span></div>
        </div>
      </div>
    );
  }
}

export default App;