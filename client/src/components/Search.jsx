import React, { Component } from 'react';
import '../App.css';

const placeHolderText = 'all';

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: 'all',
    };

    this.searchTextChanged = this.searchTextChanged.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  searchTextChanged(e) {
    this.setState({searchText: e.target.value});
  }

  handleSearch() {
    document.getElementById('loadingText').style.display = '';
    this.props.clearLinks();
    this.props.search(this.state.searchText);
  }

  animateText(letterIndex) {
    if (placeHolderText.length === letterIndex) {
      let submitSearch = document.getElementById('submitSearch');
      submitSearch.click();
      submitSearch.focus();
      setTimeout(function() {
        submitSearch.blur();
      }, 1000);
      return;
    } 

    setTimeout(function() {
      window.requestAnimationFrame(function() {
        this.animateText(letterIndex + 1);
      }.bind(this));
    }.bind(this), 450);

    let searchInput = document.getElementById('searchInput');
    let searchInputVal = searchInput.value;
    searchInput.value = searchInputVal + placeHolderText[letterIndex];
  }

  componentDidMount() {
    document.getElementById('searchInput').focus();
    setTimeout(function() {
      window.requestAnimationFrame(function() {
        this.animateText(0);
      }.bind(this));
    }.bind(this), 450);

    var searchInput = document.getElementById('searchInput');
    var submitSearch = document.getElementById('submitSearch');
    searchInput.addEventListener("keydown", function (e) {
        if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
          submitSearch.click();
          submitSearch.focus();
          setTimeout(function() {
            submitSearch.blur();
          }, 700);
          submitSearch.click();
        }
    });
  }

  render() {
    return (
      <div className="flex three">
        <div><span></span></div>
        <div>
          <h2>Search Reddit for Gifs</h2>
        </div>
        <div className="off fourth"><span></span></div>
        <div><span></span></div>
        <div>
          <input id="searchInput" value={this.props.searchText} onChange={this.searchTextChanged} />
        </div>
        <div>
          <input id="submitSearch" value="Search" onClick={this.handleSearch} type="submit" />
        </div>
      </div>
    );
  }
}

export default Search;