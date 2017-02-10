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
  }
  handleSearchResponse(link) {
    let currLinks = this.state.links;
    currLinks.push(link);

    this.setState({links: currLinks});
  }
  render() {
    var linkRows = [];
    this.state.links.forEach(function(link, index) {
      linkRows.push(
        <article className="card div">
          <header>
            <a href={link.link}key={index}>{link.link}</a>
          </header>
        </article>
      );
    });

    return (
      <div className="App">
        <Search handleSearchResponse={this.handleSearchResponse}/>
        {linkRows}
      </div>
    );
  }
}

export default App;
