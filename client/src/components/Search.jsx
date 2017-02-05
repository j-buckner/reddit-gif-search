import React, { Component } from 'react';
import '../App.css';

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: ''
    };

    this.searchTextChanged = this.searchTextChanged.bind(this);
    this.search = this.search.bind(this);
  }

  search() {
    let text = this.state.searchText;
    let client_token = window.client_token;
    return fetch(`api/search?ct=${client_token}&q=${text}`, {
      accept: 'application/json',
    }).then(this.checkStatus)
      .then(this.parseJSON)
      .then(this.cb);
  }

  checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      const error = new Error(`HTTP Error ${response.statusText}`);
      error.status = response.statusText;
      error.response = response;
      console.log(error); // eslint-disable-line no-console
      throw error;
    }
  }

  parseJSON(response) {
    return response.json();
  }

  cb(response) {
    console.log(response);
  }

  searchTextChanged(e) {
    this.setState({searchText: e.target.value});
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