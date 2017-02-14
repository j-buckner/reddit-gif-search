import React, { Component } from 'react';
import '../App.css';

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
    };

    this.searchTextChanged = this.searchTextChanged.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  searchTextChanged(e) {
    this.setState({searchText: e.target.value});
  }

  handleSearch() {
    this.props.search(this.state.searchText);
  }

  render() {
    return (
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
          <input id="submitSearch" value="Search" onClick={this.handleSearch} type="submit" />
        </div>
      </div>
    );
  }
}

export default Search;