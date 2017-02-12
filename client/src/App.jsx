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
    let currLinks = this.state.links;
    let newLinks = currLinks.concat(links);

    this.setState({links: newLinks});
  }

  onImgLoadFailed(event) {
    let failedURL = event.target.src;
    let linksUpdated = this.state.links.filter(function(link){
      return (link.url !== failedURL);
    });

    this.setState({links: linksUpdated});
  }

  onImgLoad(event) {
    const { links } = this.state;

    let imgWidth = event.target.width;
    let imgHeight = event.target.height;

    let aspectRatio = imgWidth / imgHeight;

    let targetHeight = 350;
    let targetWidth = targetHeight * aspectRatio;

    event.target.width = targetWidth;
    event.target.height = targetHeight;

    let c_id = event.target.parentElement.getAttribute('data-cid');

    let newLinks = Object.assign([], links);
    newLinks.some(function(currLink, index) {
      if (currLink.c_id === c_id) {
        newLinks[index]["width"] = targetWidth;

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

      layout.push({i: link.c_id, x: currX, y: 0, w: linkWidth, h:9 , static: false});
      
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
      'pointer-events': 'none'
    };

    this.state.links.forEach(function(link, index) {
      linkRows.push(
        <div key={link.c_id} data-cid={link.c_id}>
          <img onLoad={this.onImgLoad} style={imgStyle} onError={this.onImgLoadFailed} src={link.url} alt=":("/>
        </div>
      );
    }.bind(this));

    return (
      <div className="App">
        <div className="SearchDiv">
          <Search handleSearchResponse={this.handleSearchResponse}/>
        </div>
        <ReactGridLayout className="layout" layout={layout} cols={window.innerWidth} rowHeight={30} width={window.innerWidth}>        
          {linkRows}
        </ReactGridLayout>
        
      </div>
    );
  }
}

export default App;