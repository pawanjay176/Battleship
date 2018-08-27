var React = require('react');
import {render} from 'react-dom';
import MerkleTree, { checkProof, merkleRoot, checkProofSolidityFactory } from 'merkle-tree-solidity'
import { sha3 } from 'ethereumjs-util'
var Turn = require('./turn');

var BattleshipApp = React.createClass({

	ORIENTATIONS: [ 'vertical', 'horizontal'],
	SHIP_LENGTHS: [5, 4, 4, 3, 2], // 5 ships with lengths 5, 4, 4, 3, 2


	getInitialState: function() {
    return {
			gameBoardA: [
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0]
									],
			gameBoardB: [
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0],
										[0,0,0,0,0,0,0,0,0,0]
									],
			currentTurn: ''
    }
  },

  componentWillUpdate: function(nextProps, nextState) {
  	this.determineWinner();
  },

	newGame: function(){
		var newBoardA = this.placeShips(this.getInitialState().gameBoardA),
				newBoardB = this.placeShips(this.getInitialState().gameBoardB);
		this.getGameRoot(newBoardA);
				this.setState({
			gameBoardA: newBoardA,
			gameBoardB: newBoardB,
			currentTurn: 'A'
		});
	},


	getGameRoot: function (board) {
		var flattenedBoard = this.flattenArray(board);
		console.log(flattenedBoard);
		var boardWithRandomness = flattenedBoard.map(i => i.toString().concat((this.getRandomInt(1000, 100000).toString())));
		var byte32Board = boardWithRandomness.map(e => sha3(e));
		const merkleTree = new MerkleTree(byte32Board);
		const merkleRoot = merkleTree.getRoot();
		const proof = merkleTree.getProof(byte32Board[45]);
		console.log(checkProof(proof, merkleRoot, byte32Board[45]));
	},

	getRandomInt: function(min, max) {
	  // will return a random integer between the min and max (inclusive)
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	placeShips: function(board){
		var shipLengths = this.SHIP_LENGTHS,
				self = this;

		shipLengths.forEach(function(length){
			var orientation = self.ORIENTATIONS[self.getRandomInt(0,1)],
					startRowAndIndex = self.getStartRowAndIndex(orientation, length),
					startRow = startRowAndIndex.startRow,
					startIndex = startRowAndIndex.startIndex;
			board = self.placeShip(board, orientation, length, startRow, startIndex);
		});
		return board;
	},

	getStartRowAndIndex: function(orientation, length){
		var startIndex,
				startRow,
				rowAndIndex = {}
		if(orientation == 'vertical'){
			startRow = this.getRandomInt(0,9-length);
			startIndex = this.getRandomInt(0,9);
		}else if(orientation == 'horizontal'){
			startRow = this.getRandomInt(0,9);
			startIndex = this.getRandomInt(0,9-length);
		}
		return rowAndIndex = { startRow: startRow, startIndex: startIndex }
	},

	placeShip: function(board, orientation, length, startRow, startIndex){
		// recursively place each ship until all ships are placed and don't overlap
		var shipPlaced,
				self = this,
				newBoard;
		while(!shipPlaced){
			if(self.checkOverlap(board, orientation, length, startRow, startIndex) == false){
				shipPlaced = true;
				newBoard = self.buildShip(board, orientation, length, startRow, startIndex);
			}else{
				var newStartIndex = self.getStartRowAndIndex(orientation, length).startIndex;
				var newStartRow = self.getStartRowAndIndex(orientation, length).startRow;
				self.placeShip(board, orientation, length, newStartRow, newStartIndex);
				newBoard = board;
			}
			return shipPlaced = newBoard;
		}
		return newBoard;
	},

	checkOverlap: function(board, orientation, length, startRow, startIndex){
		// make sure ships being placed on the board don't overlap
		var overlap = false;
		if(orientation == 'vertical'){
			for(var i = startRow; i < startRow + length; i++){
				if(board[i][startIndex] == 1){
					overlap = true;
				}
			}
		}else if(orientation == 'horizontal'){
			for(var i = startIndex; i < startIndex + length; i++){
				if(board[startRow][i] == 1){
					overlap = true;
				}
			}
		}
		return overlap;
	},

	buildShip: function(board, orientation, length, startRow, startIndex){
		if(orientation == 'vertical'){
			for(var i = startRow; i < startRow + length; i++){
				board[i][startIndex] = 1;
			}
		}else if(orientation == 'horizontal'){
			for(var i = startIndex; i < startIndex + length; i++){
				board[startRow][i] = 1;
			}
		}
		return board;
	},

	findSum: function(array){
		var sum = array.reduce(function(a, b) {
		  return a + b;
		});
		return sum
	},

	flattenArray: function(nestedArray){
		var newArray = nestedArray.reduce(function(a, b) {
		  return a.concat(b);
		}, []);
		return newArray;
	},

	instancesInArray: function(array, value){
		var total = array.reduce(function(count, el) {
		    return count + (el === value);
		}, 0);
		return total;
	},

	determineWinner: function(){
		// TODO: refactor to know when each ship was sunk
		var total_possible = this.findSum(this.SHIP_LENGTHS);
		var playerA = this.instancesInArray(this.flattenArray(this.state.gameBoardB), 2),
				playerB = this.instancesInArray(this.flattenArray(this.state.gameBoardA), 2);
		if(playerA >= total_possible){
			alert('Player A is the winner!');
		}else if(playerB >= total_possible){
			alert('Player B is the winner!');
		}
	},

	handleSelect: function(square){
		// STATUS_KEY: {
		// 								0: open,
		// 								1: ship,
		// 								2: damage,
		// 								3: missed
		// 							}
		var newState,
				gameBoard = square.props.gameBoard,
				status = gameBoard[square.props.row][square.props.index],
		 		newStatus = status,
		 		currentTurn = this.state.currentTurn,
		 		enemyBoard = this.state.currentTurn == 'A' ? this.state.gameBoardA : this.state.gameBoardB;
    switch(status){
      case 0:
        newStatus = 3;
        console.log('Missed!');
        break;
      case 1:
        newStatus = 2;
        console.log('Boom! You hit a ship');
        break;
      case 2:
        console.log('You already shot here, silly');
        break;
      case 3:
        console.log('You already shot here, silly');
        break;
    }
    gameBoard[square.props.row][square.props.index] = newStatus;
    this.setState({
    	gameBoard: gameBoard,
    	enemyBoard: enemyBoard
    });
	},

	hideBoard: function(){
		this.setState({
			boardHidden: true
		})
	},

	showNextTurn: function(){
		this.setState({
			boardHidden: false,
			currentTurn: this.state.currentTurn == 'A' ? 'B' : 'A'
		})
	},

	render: function(){
		var buttonClasses = this.state.boardHidden ? 'button-visible' : 'button-hidden';
		return(
			<div className='game-body'>
				<h3> Battleship! </h3>
				<p> Click new game to begin!</p>
				<button onClick={this.newGame}>New Game</button>
				<div className='key'>
					Key
					<p className='ship'>Your Ships</p>
					<p className='open'>Open Water</p>
					<p className='damage'>Damage to Your Ship</p>
				</div>
				<Turn handleSelect={this.handleSelect}
							currentTurn={this.state.currentTurn}
							gameBoardA={this.state.gameBoardA}
							gameBoardB={this.state.gameBoardB}
							boardHidden={this.state.boardHidden}
							hideBoard={this.hideBoard}/>
				<button onClick={this.showNextTurn} className={buttonClasses}>Show Next Turn</button>
			</div>
		)
	}
});

render(<BattleshipApp/>, document.getElementById('app'));