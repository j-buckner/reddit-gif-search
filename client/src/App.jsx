import React, { Component } from 'react';
import './App.css';
import Search from './components/Search.jsx';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';

const io = require('socket.io-client');
const socket = io.connect('/');

var ReactGridLayout = require('react-grid-layout');

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
    this.generateLayout = this.generateLayout.bind(this);
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
    this.setState({nextAfter: after});
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
    let failedURL = event.target.src.replace(/webm/i, 'gifv');
    let linksUpdated = this.state.links.filter(function(link){
      return (link.url !== failedURL);
    });

    this.setState({links: linksUpdated});
  }

  onImgLoad(event) {
    const { links } = this.state;

    event.target.style.display = '';
    
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

    let targetHeight = 350;
    let targetWidth = targetHeight * aspectRatio;

    if (event.target.videoWidth && event.target.videoHeight) {
      event.target.setAttribute('width', targetWidth);
      event.target.setAttribute('height', targetHeight);
    } else {
      event.target.width = targetWidth;
      event.target.height = targetHeight;
    }

    let c_id = event.target.parentElement.getAttribute('data-cid');

    let newLinks = Object.assign([], links);
    newLinks.some(function(currLink, index) {
      if (currLink.c_id === c_id) {
        newLinks[index]["width"] = targetWidth;
        newLinks[index]["height"] = targetHeight;

        this.setState({links: newLinks});
        return true;
      }
    }.bind(this));
  }

  generateLayout() {
    const { links } = this.state;

    if (links.length === 0) return [];

    let layout = [];
    let currX = 0;
    links.forEach(function(link) {

      let linkWidth = 400;
      if (!link.width) {
        linkWidth = 400;
      } else {
        linkWidth = link.width + 10;
      }

      let linkHeight = 400;
      if (!link.height) {
        linkHeight = 400;
      } else {
        linkHeight = link.height + 10;
      }

      // linkHeight = Math.round(linkHeight/30);

      // Hard code for now
      linkHeight = 9;

      layout.push({i: link.c_id, x: currX, y: 0, w: linkWidth, h:linkHeight, static: false});
      
      if (currX + linkWidth > window.innerWidth) {
        currX = 0;
      } else {
        currX += linkWidth;
      }
    });

    return layout;
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
    var linkRows = [];
    var layout = this.generateLayout();
    const imgStyle = {
      'pointerEvents': 'none',
      'display': 'none'
    };

    // <div className="link-div" key={link.c_id} data-cid={link.c_id}>
    //   <img onLoad={this.onImgLoad} style={imgStyle} onError={this.onImgLoadFailed} src={link.url} alt=":("/>
    //   <div>
    //     <a href={link.url}>Link</a>
    //   </div>
    // </div>

    this.state.links.forEach(function(link, index) {
      let type = link.url.includes('gifv') ? 'gifv' : 'gif';
      if (type === 'gifv'){
        let newURL = link.url.replace(/gifv/i, 'webm');
        linkRows.push(
          <div className="link-div" key={link.c_id} data-cid={link.c_id}>
            <video onLoadedMetadata={this.onImgLoad} style={imgStyle} preload="none" autoPlay="autoplay" loop="loop" >
                <source src={newURL} type="video/webm" onError={this.onImgLoadFailed}></source>
            </video> 
          </div>
        );
      } else {
        linkRows.push(
          <div className="link-div" key={link.c_id} data-cid={link.c_id}>
            <img onLoad={this.onImgLoad} style={imgStyle} onError={this.onImgLoadFailed} src={link.url} alt=":("/>
          </div>
        );
      }
    }.bind(this));

    return (
      <div className="App">
        <div className="SearchDiv">
          <Search search={this.search}/>
        </div>
        <ReactGridLayout className="layout" 
          layout={layout} 
          cols={window.innerWidth} 
          rowHeight={30} 
          width={window.innerWidth} 
          isResizable={false}>        
          {linkRows}
        </ReactGridLayout>
      </div>
    );
  }
}

export default App;