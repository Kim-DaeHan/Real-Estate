pragma solidity >=0.4.21 <0.6.0;

contract RealEstate {
    struct Buyer {
        address buyerAddress;
        bytes32 name;
        uint age;
    }

    mapping(uint => Buyer) public buyerInfo;    //매물의 아이디를 키값으로 value값으로 매입자의 정보를 불러옴
    address public owner; //상태 변수에 public 붙히면 자동적으로 owner 변수에 get함수 적용
    address[10] public buyers; //딱 10명만 살수 있음, 매입주 주소를 저장, 매물을 구입하고 있는 계정을 이 배열에 저장(buyers[_id] = msg.sender)

    event LogBuyRealEstate(            //이벤트의 내용도 블록안에 저장
        address _buyer,
        uint _id
    );

    constructor() public{
        owner = msg.sender;     //msg.sender:현재 사용하는 계정으로 컨트랙안에있는 생성자나 함수를 불러오는 것(주소형 값)
    }

    function buyRealEstate(uint _id, bytes32 _name, uint _age) public payable{
        require(_id >= 0 && _id <= 9);
        buyers[_id] = msg.sender;   //현재 이함수를 사용하고있는 계정, 매개변수로 받은 매물의 아이디를 인덱스값으로 써서 저장
        buyerInfo[_id] = Buyer(msg.sender, _name, _age);    //현재 계정의 주소, 이름, 나이를 넘겨서 매핑의 value 값 만듬

        //owner.transfer(msg.value); //솔리디티 버전문제

        address(uint160(owner)).transfer(msg.value); //msg.value 는 이함수로 넘어온 이더, 오너한테 매입가를 트랜스퍼~
        //가나슈 2번째 계정에서 이더를 보내서 1번째 계정에 이더가 늘어남
        emit LogBuyRealEstate(msg.sender, _id); //이벤트 발생후 블록 log부분에 정보 저장
    }

    function getBuyerInfo(uint _id) public view returns (address, bytes32, uint){   //리턴 타입은 struct Buyer 타입과 매치
        Buyer memory buyer = buyerInfo[_id];
        return (buyer.buyerAddress, buyer.name, buyer.age);
    }

    function getAllBuyers() public view returns (address[10] memory) {  //솔리디티 5버전은 memory 붙혀줘야함
        return buyers;
    }
}
