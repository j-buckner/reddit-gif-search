import React, { Component } from 'react';
import { Grid, Dropdown } from 'semantic-ui-react'
import '../App.css';

const placeHolderText = 'all';

const sortTimeOptions = [
  {text: 'past hour', value: 'hour'}, 
  {text: 'past 24 hours', value: 'day'},
  {text: 'past week', value: 'week'},
  {text: 'past month', value: 'month'},
  {text: 'past year', value: 'year'},
  {text: 'all time', value: 'all'}
];

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: 'all',
      searchTime: ''
    };

    this.searchTextChanged = this.searchTextChanged.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleTimeSortChange = this.handleTimeSortChange.bind(this);
  }

  searchTextChanged(e) {
    this.setState({searchText: e.target.value});
  }

  handleSearch() {
    const { searchText, searchTime } = this.state;

    document.getElementById('loadingText').style.display = '';
    this.props.clearLinks();
    this.props.search(searchText, searchTime, '');
  }

  handleTimeSortChange(e, data) {
    const { searchText } = this.state;
    const newSearchTime = data.value;

    // should probably detect if no change happened
    this.setState({searchTime: newSearchTime});
    this.props.clearLinks();
    this.props.search(searchText, newSearchTime, '');
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
    searchInput.value += placeHolderText[letterIndex];
  }

  componentDidMount() {
    document.getElementById('searchInput').focus();
    setTimeout(function() {
      window.requestAnimationFrame(function() {
        this.animateText(0);
      }.bind(this));
    }.bind(this), 450);

    var searchInput = document.getElementById('searchInput');
    searchInput.addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
        e.preventDefault();

        let submitSearch = document.getElementById('submitSearch');
        submitSearch.click();
        submitSearch.focus();
        setTimeout(function() {
          submitSearch.blur();
        }, 1000);
      }
    });
  }

  render() {
    return (
      <Grid verticalAlign='bottom' columns={2}>
        <Grid.Row columns={2}>
          <Grid.Column width={7}>
            <Dropdown onChange={this.handleTimeSortChange} value={'all'} placeholder='Show Links From' selection options={sortTimeOptions} style={{float: 'right', width: '20px'}}/>
          </Grid.Column>
          <Grid.Column >  
            <div id="searchContainer" className="ui labeled action big input">
              <div className="ui label">
                /r/
              </div>
              <input id="searchInput" value={this.props.searchText} onChange={this.searchTextChanged} type="text" />
              <button id="submitSearch" onClick={this.handleSearch} className="ui primary button">Search</button>
            </div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

export default Search;