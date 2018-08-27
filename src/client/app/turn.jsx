var React = require('react');
var Grid = require('./grid');

var Turn = React.createClass({

  render: function(){
    var header = 'Current Player: ' + this.props.currentTurn,
        gameBoard = this.props.currentTurn == 'A' ? this.props.gameBoardA : this.props.gameBoardB,
        enemyBoard = this.props.currentTurn == 'A' ? this.props.gameBoardB : this.props.gameBoardA,
        boardClasses = this.props.boardHidden ? 'current-turn hidden' : 'current-turn';

    return(
      <div className={boardClasses} >
        <h4>{header}</h4>
        <h5>Your Ships</h5>
        <Grid key={this.props.currentTurn}
              gameBoard={gameBoard}
              currentTurn={this.props.currentTurn}/>
        <br/>
        <h5>Enemy Ships</h5>
        <p>Click on any square in the Enemy grid to fire a torpedo</p>
        <Grid key='enemy'
              enemyBoard={enemyBoard}
              handleSelect={this.props.handleSelect}
              gameBoard={enemyBoard}
              currentTurn={this.props.currentTurn}/>
        <button onClick={this.props.hideBoard} className='button-margin'>Hide Board and Switch Players</button>

      </div>
    )
  }
});

module.exports = Turn;
