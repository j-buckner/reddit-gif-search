import React, { Component } from 'react';
import './App.css';
import Search from './components/Search.jsx';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';

const io = require('socket.io-client');
const socket = io.connect('/');

var ReactGridLayout = require('react-grid-layout');
var count = 0;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      layout: [],
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
    const { c_ids, links, layout } = this.state;

    newLinks.forEach(function(link) {
      if(!c_ids.includes(link.c_id)) { 
        c_ids.push(link.c_id);
        links.push(link);
        layout.push({i: link.c_id, x: 1, y: 0, w: 350, h: 9, static: true});      
      }
    });
    
    this.setState({links: links, layout: layout, c_ids: c_ids});
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
    const { links, layout, c_ids } = this.state;

    let c_id = event.target.parentElement.parentElement.getAttribute('data-cid');
    let failedURL = event.target.src.replace(/webm/i, 'gifv');

    // Filter the failed url out of links, layout, and c_ids
    let linksUpdated = links.filter(function(link){
      return (link.url !== failedURL);
    });

    let layoutUpdated = layout.filter(function(gridRow) {
      return (gridRow.i !== c_id);
    });

    let c_idsUpdated = c_ids.filter(function(currCID) {
      return (currCID !== c_id);
    });

    this.setState({links: linksUpdated, layout: layoutUpdated, c_ids: c_idsUpdated});
  }
  
  updateLayout(layout) {
    layout.forEach(function(layoutRow, index) {
      if (index === 0) {layoutRow.x = 0; return;}
      let prevLayoutRow = layout[index - 1];
      layoutRow.x = (prevLayoutRow.x + prevLayoutRow.w + layoutRow.w) <= window.innerWidth ? (prevLayoutRow.x + prevLayoutRow.w) : 0;
    });
    this.setState({layout: layout});
  }

  onImgLoad(event) {
    const { layout } = this.state;

    let c_id = event.target.parentElement.getAttribute('data-cid');
    let layoutRowIndex = layout.findIndex(function(layoutRow) {
      return layoutRow.i === c_id;
    })


    let newIndex = layout.findIndex(function(layoutRow) { return (layoutRow.x !== 1); });
    if (newIndex === -1 || newIndex === 0) newIndex = 1;
    newIndex--;
    // console.log('new index 1 ', newIndex);
    //swap
    let prevRow = layout[layoutRowIndex];
    layout[layoutRowIndex] = layout[newIndex];
    layout[newIndex] = prevRow;

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

    // Now that the image loaded, update this link's layout row to have correct width and xPos value
    let x = 0;
    // console.log('new index: ', newIndex, 'layout is: ', layout);
    // if (newIndex !== 0) {
    //   let prevLayoutRow = layout[newIndex - 1];
    //   let prevWidth = prevLayoutRow.w;
    //   let prevX = prevLayoutRow.x;
      
    //   x = (prevX + prevWidth + targetWidth) <= window.innerWidth ? (prevX + prevWidth) : 0;
    // } 
    
    layout[newIndex] = {i: c_id, x: x, y: 0, w: targetWidth + 12, h: 9, static: false};

    if (event.target.videoWidth && event.target.videoHeight) {
      event.target.setAttribute('width', targetWidth);
      event.target.setAttribute('height', targetHeight);
    } else {
      event.target.width = targetWidth;
      event.target.height = targetHeight;
    }

    event.target.style.display = '';

    count++;
    if (count === layout.length) this.updateLayout(layout);
  }

  componentDidMount() {
    // turn off pagination for now

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
    const { links, layout } = this.state;
    // console.log('on render: ', links, layout);
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
          isResizable={false}
          margin={[10, 10]}>
          {linkRows}
        </ReactGridLayout>
      </div>
    );
  }
}

export default App;

// .link-div {
//   outline: #333 solid 2px;
// }

// .link-div:hover {
//   outline: #4747d1 solid 4px;
// }