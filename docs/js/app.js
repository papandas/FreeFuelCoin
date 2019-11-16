App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  toast: Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  }),
  init: function () {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function () {
    $.getJSON("FFCToken.json", function (assetManagementChain) {
      //console.log(assetManagementChain);
      App.contracts.tokenInstance = TruffleContract(assetManagementChain);
      App.contracts.tokenInstance.setProvider(App.web3Provider);
      App.contracts.tokenInstance.deployed().then(function (assetManagementChain) {

        console.log("Contract Address:", 'https://ropsten.etherscan.io/address/' + assetManagementChain.address);

        $('#smartContract').empty();
        $('#smartContract').html(`Smart Contract: <a href="https://ropsten.etherscan.io/address/${assetManagementChain.address}" target="_blank">${assetManagementChain.address.slice(0, 12)}......${assetManagementChain.address.slice(-8)}</a>`)

        App.listenForEvents();
        return App.render();

      });

    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
  },

  render: function () {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    console.log("Web3 Version:", web3.version)

    // Load account data
    //$('#accountDetails').empty();
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        if (account === null) {
          App.toast.fire({
            type: 'error',
            title: 'Wallet/Account details missing.'
          })

        } else {
          App.account = account;
          
          $('#ethAccount').empty();
          $('#ethAccount').html(`Wallet Address: <a href="https://ropsten.etherscan.io/address/${App.account}" target="_blank">${App.account.slice(0, 12)}...${App.account.slice(-8)}</a>`)
        }

        App.LoadLandingPage();

      } else {
        console.error("--Error--", err)
        App.toast.fire({
          type: 'error',
          title: err.message
        })
      }
    });

    //App.LoadLandingPage();

    content.show();
    loader.hide();

  },

  LoadLandingPage: function () {
    $('#loader').hide();
    $('#content').show();
    $('#content').empty();
    $('#content').load('landing.html', function(){
      web3.eth.getBalance(App.account, function (err, resp) {
        if (err === null) {
          let balance = web3.utils.fromWei(resp, 'ether');  
          $('#walletBalance').empty();
          $('#walletBalance').html(`${balance.slice(0, 7)} Eth`);
        }
      });


      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.name();
      }).then((tokenName) => {
        $('#tokenName').empty();
        $('#tokenName').html(`${tokenName}`)

        return tokenInstance.symbol();
      }).then((tokenSymbol) => {
        $('#tokenSymbol').empty();
        $('#tokenSymbol').html(`${tokenSymbol}`)

        return tokenInstance.totalSupply();
      }).then((totalSupply) => {
        $('#totalSupply').empty();
        $('#totalSupply').html(`${totalSupply}`)

        //return tokenInstance.symbol();
      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })
    });
  },




}

$(function () {
  $(window).load(function () {
    App.init();
  })
});
