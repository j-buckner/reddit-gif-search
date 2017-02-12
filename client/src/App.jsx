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
    let imgWidth = event.target.width;
    let imgHeight = event.target.height;

    let aspectRatio = imgWidth / imgHeight;

    let targetHeight = 550;
    let targetWidth = targetHeight * aspectRatio;

    event.target.width = targetWidth;
    event.target.height = targetHeight;
  }

  render() {
    var linkRows = [];
    this.state.links.forEach(function(link, index) {
      linkRows.push(
        <div key={link.url + '-' + index}>
          <article className="card div">
            <header>
              <img onLoad={this.onImgLoad} onError={this.onImgLoadFailed} src={link.url} alt=":("/>
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