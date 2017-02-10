import React, { Component } from 'react';
import '../App.css';
const io = require('socket.io-client');
const socket = io.connect('/');

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: ''
    };

    this.searchTextChanged = this.searchTextChanged.bind(this);
    this.search = this.search.bind(this);
  }

  handleSearchResponse(response) {
    console.log('link is: ', response);
  }

  search() {
    let text = this.state.searchText;
    // let client_token = window.client_token;

    socket.emit('search', text);
  }

  searchTextChanged(e) {
    this.setState({searchText: e.target.value});
  }

  componentDidMount() {
    socket.on('search-response', this.handleSearchResponse);
  }

  render() {
    return (
      <div className="App">
        <div className="flex three search">
          <div><span></span></div>
          <div>
            <h3>Search Reddit for Gifs</h3>
          </div>
          <div><span></span></div>
          <div><span></span></div>
          <div>
            <input onChange={this.searchTextChanged} placeholder="Search for gifs" />
          </div>
          <div>
            <input id="submitSearch" value="Search" onClick={this.search} type="submit" />
          </div>
        </div>
      </div>
    );
  }
}

export default Search;