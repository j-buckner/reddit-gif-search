import React, { Component } from 'react';
import './App.css';
import Search from './components/Search.jsx';
import '../node_modules/react-resizable/css/styles.css';
import '../node_modules/react-grid-layout/css/styles.css';

var ReactGridLayout = require('react-grid-layout');

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      c_ids: [],
      links: [],
      currRowX: 0,
      layout: [],
    }

    this.handleSearchResponse = this.handleSearchResponse.bind(this);
    this.onImgLoadFailed = this.onImgLoadFailed.bind(this);
    this.onImgLoad = this.onImgLoad.bind(this);
    this.generateLayout = this.generateLayout.bind(this);
  }

  handleSearchResponse(links) {

    let currCIDs = this.state.c_ids;
    let currLinks = this.state.links;
    // let bindData = {currCIDs,}
    links.forEach(function(link) {
      if(!currCIDs.includes(link.c_id)) { 
        currCIDs.push(link.c_id);
        currLinks.push(link);
      }
    });
    
    // var values = [
    //     { name: 'someName1' },
    //     { name: 'someName2' },
    //     { name: 'someName4' },
    //     { name: 'someName2' }
    // ];
    // const uniquifyLinks = links.filter((val,id,array) => array.indexOf(val) === id);
    // let uniquifyLinks = [...new Set(links)]; 

    // var linkCIDs = links.map(function(link){ return link.c_id });
    // var isDuplicate = linkCIDs.some(function(item, idx){ 
    //     return linkCIDs.indexOf(item) != idx 
    // });
    // console.log(uniquifyLinks);


    // let currLinks = this.state.uniquifyLinks;
    // let newLinks = currLinks.concat(uniquifyLinks);
    console.log(currLinks, currCIDs);
    this.setState({links: currLinks, c_ids: currCIDs});
  }

  onImgLoadFailed(event) {
    let failedURL = event.target.src.replace(/webm/i, 'gifv');
    let linksUpdated = this.state.links.filter(function(link){
      return (link.url !== failedURL);
    });

    this.setState({links: linksUpdated});
  }

  onImgLoad(event) {
    event.target.style.display = '';
    
    const { links } = this.state;
    
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
    var currX = 0;
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
        // console.log("Using cid ", link.c_id);
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
          <Search handleSearchResponse={this.handleSearchResponse}/>
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