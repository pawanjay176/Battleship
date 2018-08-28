pragma solidity ^0.4.13;

import "./MerkleProof.sol";

contract Battleship {
    address public player1;
    address public player2;
    bytes32 public player1MerkleRoot;
    bytes32 public player2MerkleRoot;
    uint public player1SuccessfulMoves = 0;
    uint public player2SuccessfulMoves = 0;
    uint public turn;
    GameStatus status;
    uint public lastMoveTime;
    uint public constant timeLimit = 2 hours;
    
    enum GameStatus {NotStarted, Player1Joined, Started, Player1Won, Player2Won}
    mapping (bytes3 => bool) public player1Moves;
    mapping (bytes3 => bool) public player2Moves;
    
    bytes3 public player1LastMove;
    bytes3 public player2LastMove;
    
    event Player1JoinedEvent(address player1);
    event Player2JoinedEvent(address player2);
    event GameStartedEvent(address player1, address player2);
    event Player1WonEvent(address player1);
    event Player2WonEvent(address player2);
    event Player1MoveEvent(bytes3 move);
    event Player2MoveEvent(bytes3 move);
    
    
    modifier GameNotStarted {
        require(status==GameStatus.NotStarted, "Game not in NotStarted phase");
        _;
    }
    
    modifier Player1Joined {
        require(status==GameStatus.Player1Joined, "Player 1 has not joined the game");
        _;
    }
    
    modifier GameStarted {
        require(status==GameStatus.Started, "Game has not started");
        _;
    }
    
    
    modifier CorrectTurn(address player) {
        require((player == player1 && turn % 2==1) || (player == player2 && turn % 2==0), "Not your turn/Invalid player");
        _;
    }
    
    // First player calls constructor
    constructor (bytes32 _boardMerkleRoot) public payable {
        player1 = msg.sender;
        player1MerkleRoot = _boardMerkleRoot;
        status = GameStatus.Player1Joined;
        emit Player1JoinedEvent(msg.sender);
    }
    
    // Also make sure game state is in Player1Joined using a modifier
    function joinGame (bytes32 _boardMerkleRoot) public payable Player1Joined {
        player2 = msg.sender;
        player2MerkleRoot = _boardMerkleRoot;
        status = GameStatus.Started;
        turn = 1;
        emit Player2JoinedEvent(msg.sender);
    }
    
    function firstMove(bytes3 _move) public {
        require(msg.sender==player1, "Invalid player");
        player1Moves[_move] = true;
        player1LastMove = _move;
        turn++;
        lastMoveTime = now;
        emit GameStartedEvent(player1, player2);
        emit Player1MoveEvent(_move);
    }
    
    /**
   * @dev Takes the current move, nonce for previous move and the fact that the previous
   * move hit a ship or not and the merkle proof for the previous move and registers the current move. 
   * @param _move current move denoted by ("000" to "100")
   * @param _nonce Nonce for previous move 
   * @param _shipOrNot denoted by "0" or "1"
   * @param _merkleProof merkleProof of previous move
   */
    function makeMove (bytes3 _move, bytes8 _nonce, byte _shipOrNot, bytes32[] _merkleProof) public GameStarted CorrectTurn(msg.sender) {
        // Player 2's turn
        if(turn%2==0) {
            require(player2Moves[_move]==false, "Already played this move");
            player2Moves[_move] = true;
            emit Player2MoveEvent(_move);
            bytes32 leafP2 = keccak256(abi.encodePacked(player1LastMove, _shipOrNot, _nonce));
            if (!MerkleProof.verifyProof(_merkleProof, leafP2, player2MerkleRoot)) {
                player1.transfer(address(this).balance);
                status = GameStatus.Player1Won;
                emit Player1WonEvent(player1);
            }
            player2LastMove = _move;
            //store time of last transaction to prevent other player not responding
            if (_shipOrNot == "1") {
                player1SuccessfulMoves++;
            }
            //if player1SuccessfulMoves becomes 17, declare winner
            if(player1SuccessfulMoves==17) {
                status = GameStatus.Player1Won;
                emit Player1WonEvent(player1);
            }
        }
        // Player 1's turn
        else {
            require(player1Moves[_move]==false, "Already played this move");
            player1Moves[_move] = true;
            emit Player1MoveEvent(_move);
            bytes32 leafP1 = keccak256(abi.encodePacked(player2LastMove, _shipOrNot, _nonce));
            if (!MerkleProof.verifyProof(_merkleProof, leafP1, player1MerkleRoot)) {
                player2.transfer(address(this).balance);
                status = GameStatus.Player2Won;
                emit Player2WonEvent(player2);
            }
            player1LastMove = _move;
            //store time of last transaction to prevent other player not responding
            if (_shipOrNot == "1") {
                player2SuccessfulMoves++;
            }
            //if player1SuccessfulMoves becomes 17, declare winner
            if(player2SuccessfulMoves==17) {
                status = GameStatus.Player2Won;
                emit Player2WonEvent(player2);
            }
        }
        lastMoveTime = now;
        turn++;
    }
        
    // Simple claim reward without any proof
    function claimReward () public {
        require((msg.sender==player1 && status == GameStatus.Player1Won) || (msg.sender==player2 && status == GameStatus.Player2Won), "Cannot claim without winning game");
        msg.sender.transfer(address(this).balance);        
    }
    
    function claimRewardOnTimeout() public {
        require((msg.sender==player1 && turn%2==0) || (msg.sender==player2 && turn%2==1), "Cannot claim timeout reward on your own move");
        require(status==GameStatus.Started, "Game not in started phase");
        if(now>=lastMoveTime+(timeLimit*1 hours)) {
            msg.sender.transfer(address(this).balance);
        }
    }

    // The winner should reveal the merkle proofs for his remaining Battleship locations
    // Otherwise, a cheating player could have not constructed a board with the exact number
    // of tiles covered
    
    // Assuming height of the merkle tree to be 7 as we have 100 elements which amounts 
    // to 128 leaf merkle tree. log 128 = 7
    // Not doing bytes32[][17] as solidity does not allow this    
    // function claimRewardWithProof(bytes32 [7][] _merkleProofs, bytes32 [17] _leafs) public {
        
    // }
    
       
    
    
    
    
    
}