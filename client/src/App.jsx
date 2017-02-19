import React, { Component } from 'react';
import './App.css';
import Search from './components/Search.jsx';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';

const io = require('socket.io-client');
const socket = io.connect('/');

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      c_ids: [],
      links: [],
      after: '',
      nextAfter: '',
      currSearchText: ''
    }

    this.search = this.search.bind(this);
    this.handleSearchResponse = this.handleSearchResponse.bind(this);
    this.handleSearchResponseAfter = this.handleSearchResponseAfter.bind(this);
    this.onImgLoadFailed = this.onImgLoadFailed.bind(this);
    this.onImgLoad = this.onImgLoad.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  search(searchText) {
    const { links, after, nextAfter } = this.state;
    if ((after === nextAfter) && (links.length !== 0)) return;

    this.setState({after: this.state.nextAfter});
    this.setState({currSearchText: searchText});

    let searchData = {text: searchText, after: nextAfter}

    socket.emit('search', searchData);
  }

  handleSearchResponse(newLinks) {
    const { c_ids, links } = this.state;

    newLinks.forEach(function(link) {
      if(!c_ids.includes(link.c_id)) { 
        c_ids.push(link.c_id);
        links.push(link);
      }
    });
    
    this.setState({links: links, c_ids: c_ids});
  }

  handleSearchResponseAfter(after) {
    const { currSearchText } = this.state;
    
    // Set pagination - if the current page isn't filled call for next page now
    if (document.body.scrollHeight <= document.body.clientHeight) {
      this.setState({after: after});
      socket.emit('search', {text: currSearchText, after: after});
    } else {
      this.setState({nextAfter: after});
    }
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
    const { links, c_ids } = this.state;

    let c_id = event.target.parentElement.parentElement.getAttribute('data-cid');
    let failedURL = event.target.src.replace(/webm/i, 'gifv');

    // Filter the failed url out of links and c_ids
    let linksUpdated = links.filter(function(link){
      return (link.url !== failedURL);
    });

    let c_idsUpdated = c_ids.filter(function(currCID) {
      return (currCID !== c_id);
    });

    this.setState({links: linksUpdated, c_ids: c_idsUpdated});
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

    let targetHeight = 300;
    let targetWidth = targetHeight * aspectRatio;

    if (event.target.videoWidth && event.target.videoHeight) {
      event.target.setAttribute('width', targetWidth);
      event.target.setAttribute('height', targetHeight);
    } else {
      event.target.width = targetWidth;
      event.target.height = targetHeight;
    }

    event.target.style.display = '';
    event.target.style.margin = "3.5px";
  }

  componentDidMount() {
    document.addEventListener("scroll", function (event) {
      if (this.getDocHeight() === this.getScrollXY()[1] + window.innerHeight) { 
        this.search(this.state.currSearchText);
        this.setState({"nextAfter": this.state.after});
      }
    }.bind(this));

    socket.on('search-response', this.handleSearchResponse);
    socket.on('search-after', this.handleSearchResponseAfter);

    // initialize data
    // this.search();
  }

  render() {
    const { links } = this.state;
    const imgStyle = {
      'pointerEvents': 'none',
      'display': 'none'
    };

    const linkRows = [];
    links.forEach(function(link, index) {
      let type = link.url.includes('gifv') ? 'gifv' : 'gif';
      if (type === 'gifv'){
        let newURL = link.url.replace(/gifv/i, 'webm');
        linkRows.push(
          <video key={link.c_id} onLoadedMetadata={this.onImgLoad} style={imgStyle} preload="none" autoPlay="autoplay" loop="loop" >
              <source src={newURL} type="video/webm" onError={this.onImgLoadFailed}></source>
          </video>
        );
      } else {
        linkRows.push(
          <img key={link.c_id} onLoad={this.onImgLoad} style={imgStyle} onError={this.onImgLoadFailed} src={link.url} alt=":("/>
        );
      }
    }.bind(this));

    return (
      <div className="App">
        <div className="SearchDiv">
          <Search search={this.search}/>
        </div>
        {linkRows}
      </div>
    );
  }
}

export default App;