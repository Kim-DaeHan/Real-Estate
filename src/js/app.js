App = {
  web3Provider: null,
  contracts: {},
	
  init: function() {
    $.getJSON('../real-estate.json', function(data){    //data 제이슨 배열
      var list = $('#list');
      var template = $('#template');

      for(i = 0; i < data.length; i++){
        template.find('img').attr('src', data[i].picture);  //템플렛에서 img 태그를 찾고 src 속성의 json 배열 각 인덱스에 있는 picture 값을 갖게한다.
        template.find('.id').text(data[i].id);
        template.find('.type').text(data[i].type);
        template.find('.area').text(data[i].area);
        template.find('.price').text(data[i].price);

        list.append(template.html());
      }
    })

    return App.initWeb3();
  },

  initWeb3: function() {
    //web3 는 솔리디티랑 자바스크립트 연결다리 역할
    if(typeof web3 !== 'undefined'){      //메타마스크가 깔려 있는경우, web3 가 undefined일경우는 메타마스크가 안 깔려있을때
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else{
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');  //주입된 web3 인스턴스가 없다면 로컬(RPC 서버) 공급자에 연결해서 정보를 가져와서 web3Provider 변수에 대입
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function() {
		$.getJSON('RealEstate.json', function(data){
      App.contracts.RealEstate = TruffleContract(data);   //컨트랙 인스턴스화
      App.contracts.RealEstate.setProvider(App.web3Provider);   //컨트택의 공급자 설정
      App.listenToEvents();
    });
  },

  buyRealEstate: function() {	
    var id = $('#id').val();  //hidden타입의 input(id) 값
    var name = $('#name').val();
    var price = $('#price').val();
    var age = $('#age').val();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.RealEstate.deployed().then(function(instance) {
        var nameUtf8Encoded = utf8.encode(name);
        return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age, { from: account, value: price });  //인코딩 시킨 이름을 hex로 변환해서 넘김
      }).then(function() {
        $('#name').val('');
        $('#age').val('');
        $('#buyModal').modal('hide');
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  loadRealEstates: function() {
    App.contracts.RealEstate.deployed().then(function(instance){
      return instance.getAllBuyers.call();
    }).then(function(buyers){
      for(i = 0; i < buyers.length; i++){
        if(buyers[i] !== '0x0000000000000000000000000000000000000000') {  //매물이 팔렸다면(구매자 배열에 빈주소가 없다면)
          var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(7);   //팔린 매물을 찾아서 매물의 이미지 이름만

          //각 이미지에 따른 매각 이미지 변경
          switch(imgType){
            case 'apartment.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/apartment_sold.jpg')
              break;
            case 'townhouse.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/townhouse_sold.jpg')
              break;  
            case 'house.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg')
              break;                          
          }
          //매각버튼비활성화, 매입자정보 버튼 활성화
          $('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true);
          $('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');
        } 
      }
    }).catch(function(err){
      console.log(err.message);
    })
  },
	
  listenToEvents: function() {
    App.contracts.RealEstate.deployed().then(function(instance){
      //{} 처음 파라미터는 필터링, 필터링 옵션 사용하지않고 기본 모든 이벤트 감지
      //두번째 파라미터는 범위, 0번째 블록에서 최근 블록 까지 로그 감지
      instance.LogBuyRealEstate({}, { fromBlock: 0, toBlock: 'latest'}).watch(function(error, event){ //LogBuyRealEstate접근해서 watch(계속 감지) 
        if(!error){
          $('#events').append('<p>' + event.args._buyer + ' 계정에서 ' + event.args._id + ' 번 매물을 매입했습니다.' + '</p>')
        } else{
          console.error(error);
        }
        App.loadRealEstates();
      })
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
  //html 페이지가 다 로드가 되었을때 어떤걸 실행하라고 정의 할 수 있는 공간
  $('#buyModal').on('show.bs.modal', function(e){
    //해당 템플릿의 id 필드를 찾고 그 id 값을 변수에 저장
    //e.relatedTarget == 매입버튼 
    var id = $(e.relatedTarget).parent().find('.id').text();
    //템플릿의 가격 필드에서 가져온 이더값이 스트링 타입 그것을 float 타입으로 바꾸고 toWel를 써서 이더값을 wei로 바꿔서 변수 저장
    var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether");

    //모달에 있는 id 속성이 id 인것과 price인것을 찾아서 각각의 input val에 id, price 값을 담아둠
    //e.currentTarget == buyModal 모달
    $(e.currentTarget).find('#id').val(id);
    $(e.currentTarget).find('#price').val(price);
  });

  $('#buyerInfoModal').on('show.bs.modal', function(e){
    //해당 템플릿의 id 필드를 찾고 그 id 값을 변수에 저장
    var id = $(e.relatedTarget).parent().find('.id').text();
   
    App.contracts.RealEstate.deployed().then(function(instance){
      return instance.getBuyerInfo.call(id);
    }).then(function(buyerInfo){
      $(e.currentTarget).find('#buyerAddress').text(buyerInfo[0]);
      $(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyerInfo[1]));
      $(e.currentTarget).find('#buyerAge').text(buyerInfo[2]);
    }).catch(function(err){
      console.log(err.message);
    })
  });
});
