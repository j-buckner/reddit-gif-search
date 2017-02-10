import React, { Component } from 'react';
import './App.css';
import Search from './components/Search.jsx';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      links: []
    }

    this.handleSearchResponse = this.handleSearchResponse.bind(this);
    this.onImgLoadFailed = this.onImgLoadFailed.bind(this);
  }

  handleSearchResponse(link) {
    let currLinks = this.state.links;
    currLinks.push(link);

    this.setState({links: currLinks});
  }

  onImgLoadFailed(event) {
    console.log(event.target.src);
    let failedURL = event.target.src;

    let linksUpdated = this.state.links.filter(function(link){
      return (link.link !== failedURL);
    });

    this.setState({links: linksUpdated});
  }

  onImgLoad(event) {
    let imgWidth = event.target.width;
    let imgHeight = event.target.height;

    let aspectRatio = imgWidth / imgHeight;

    let targetHeight = 550;
    let targetWidth = targetHeight * aspectRatio;

    event.target.width = targetWidth;
    event.target.height = targetHeight;
    // console.log('aspect ratio: ', imgWidth, imgHeight, aspectRatio);
  }

  render() {
    var linkRows = [];
    this.state.links.forEach(function(link, index) {
      linkRows.push(
        <div key={link.link + '-' + index}>
          <article className="card div">
            <header>
              <img onLoad={this.onImgLoad} onError={this.onImgLoadFailed} src={link.link} alt=":("/>
            </header>
          </article>
        </div>
      );
    }.bind(this));

    return (
      <div className="App">
        <div className="SearchDiv">
          <Search handleSearchResponse={this.handleSearchResponse}/>
        </div>
        <div className="flex one">
          {linkRows}
        </div>
      </div>
    );
  }
}

export default App;


// <a href={link.link}>{link.link}</a>