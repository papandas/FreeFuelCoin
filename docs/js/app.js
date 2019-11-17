App = {
  web3Provider: null,
  contracts: {},
  owner: "0xB6F2d6e2439876a35473811c33e52863E2173536",
  account: '0x0',
  loading: false,
  pageLoaded: false,
  myTokenBalance: 0,
  totalTokenSupply: 0,
  toast: Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  }),
  init: function () {
    console.log("App initialized...")
    console.log("IsMasterAdmin", App.owner);
    console.log("Account01", "0x75469abd7de79afbdda914a27d9f8964204faeba");
    console.log("Account02", "0x7c430ba4f4547f3ccc6a2362a76b5ac879ba24bf");
    console.log("Account03", "0xB2E1e1Aee71885C79E0C0384733F0E4E020F7Fb7");
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
    App.contracts.tokenInstance.deployed().then(function (instance) {

      instance.Approval({
        fromBlock: 0,
        toBlock: 'latest'
      }, function (error, event) {
        if (App.pageLoaded == true && App.account.toLowerCase() == event.args.spender.toLowerCase()) {
          console.log("[" + event.event + "]", "Spender:", event.args.spender);
          App.pageLoaded = false;
          App.LoadLandingPage();
        }
      })

      instance.Transfer({
        fromBlock: 0,
        toBlock: 'latest'
      }, function (error, event) {
        //console.log(App.pageLoaded, App.account, typeof(event.args.to), (App.account.toLowerCase() == event.args.to.toLowerCase()))
        if (App.pageLoaded == true
          && (App.account.toLowerCase() == event.args.from.toLowerCase() || App.account.toLowerCase() == event.args.to.toLowerCase())) {
          console.log("[" + event.event + "]", "From:", event.args.from, "To:", event.args.to, "Value:", event.args.value.toNumber());
          App.pageLoaded = false;
          App.LoadLandingPage();
        }
      })


      instance.PauserAdded({
        fromBlock: 0,
        toBlock: 'latest'
      }, function (error, event) {
        if (App.pageLoaded === true && App.account.toLowerCase() === event.args.account.toLowerCase()) {
          console.log("[" + event.event + "]", "account:", event.args.account.toLowerCase());
          App.pageLoaded = false;
          App.LoadLandingPage();
        }
      })


      instance.MinterAdded({
        fromBlock: 0,
        toBlock: 'latest'
      }, function (error, event) {
        if (App.pageLoaded === true && App.account.toLowerCase() === event.args.account.toLowerCase()) {
          console.log("[" + event.event + "]", "newMinter account:", event.args.account.toLowerCase());
          App.pageLoaded = false;
          App.LoadLandingPage();
        }
      })


    })
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
          $('#ethAccount').html(`Wallet Address: <a href="https://ropsten.etherscan.io/address/${App.account}" target="_blank">${App.account}</a>`)

          App.LoadLandingPage();
        }

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

    if (App.pageLoaded === true) {
      return;
    }

    $('#loader').hide();
    $('#content').show();
    $('#content').empty();
    $('#content').load('landing.html', function () {

      /**
       * Hide List
       */
      $('#minter').hide();

      /**
       * Get Wallet Balance
       */
      web3.eth.getBalance(App.account, function (err, resp) {
        if (err === null) {
          let balance = web3.utils.fromWei(resp, 'ether');
          $('#walletBalance').empty();
          $('#walletBalance').html(`${balance.slice(0, 7)} Eth`);
        }
      });

      /**
       * Get Allowence Approved
       */
      if (App.owner === App.account) {
        $('#tokenAllowance').empty();
      } else {

      }

      /**
       * Get rest of the variables.
       */
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
        App.totalTokenSupply = parseInt(totalSupply);

        $('#totalSupply').empty();
        $('#totalSupply').html(`${web3.utils.fromWei(totalSupply.toString(),'ether')} FFC`)

        return tokenInstance.balanceOf(App.account);
      }).then((balanceOf) => {
        App.myTokenBalance = parseInt(balanceOf)

        let balanceInEth = web3.utils.fromWei(balanceOf.toNumber().toString(), 'ether')
        $('#tokenBalance').empty();
        $('#tokenBalance').html(`${balanceInEth} FFC`)

        return tokenInstance.allowance(App.owner, App.account);
      }).then((tokenAllowance) => {
        $('#tokenAllowance').empty();
        $('#tokenAllowance').html(`${web3.utils.fromWei(tokenAllowance.toNumber().toString(), 'ether')} FFC`);

        if(tokenAllowance.toNumber() > 0){
          $('#allowanceTokenTransfer').show();
        }else{
          $('#allowanceTokenTransfer').hide();
        }


        return tokenInstance.isMinter(App.account);
      }).then((isMinter) => {
        $('#permissionToMint').empty(); 
        $('#permissionToMint').html(`${isMinter.toString().toUpperCase()}`);

        if (isMinter) {
          $('#minter').show();
        } else {
          $('#minter').hide();
        }

        App.pageLoaded = true;
        console.log("Loading Over!")


        /*var bar1 = new ldBar("#progressBar");
        var bar2 = document.getElementById('progressBar').ldBar;
        var percent = (App.myTokenBalance / App.totalTokenSupply * 100);
        bar2.set(percent);*/

        //return tokenInstance.symbol();
      }).then(() => {

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

  saveBurnToken: function () {
    const balance = $('#burnTokenTF').val();

    if (parseInt(balance) > 0) {

      $('#loader').show();
      $('#content').hide();

      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.burn(parseInt(balance), { from: App.account });
      }).then((receipt) => {

        if (receipt.tx) {
          App.toast.fire({
            type: 'success',
            title: 'Burning token was successfully saved.'
          })
          console.log(receipt)

          App.LoadLandingPage();

        } else {
          App.toast.fire({
            type: 'error',
            title: 'Burning token was not successfully.'
          })
        }

        $('#loader').hide();
        $('#content').show();

      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })

    } else {
      App.toast.fire({
        type: 'error',
        title: 'Invalid input.'
      })
    }
  },

  saveMintToken: function () {
    const balance = $('#mintTokenTF').val();
    const toAccount = $('#toAccount').val();

    if (parseInt(balance) > 0) {

      $('#loader').show();
      $('#content').hide();

      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.mint(toAccount, parseInt(balance), { from: App.account });
      }).then((receipt) => {

        if (receipt.tx) {
          App.toast.fire({
            type: 'success',
            title: 'Minting was successfully saved.'
          })
          console.log(receipt)

          App.LoadLandingPage();

        } else {
          App.toast.fire({
            type: 'error',
            title: 'Minting was not successfully.'
          })
        }

        $('#loader').hide();
        $('#content').show();

      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })

    } else {
      App.toast.fire({
        type: 'error',
        title: 'Invalid input.'
      })
    }
  },

  saveChangeMinter: function () {
    const address = $('#addMinterWalletAddress').val();

    if (web3.utils.isAddress(address) && App.account.toLowerCase() !== address.toLowerCase()) {

      $('#loader').show();
      $('#content').hide();

      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.addMinter(address, { from: App.account });
      }).then((receipt) => {

        if (receipt.tx) {
          App.toast.fire({
            type: 'success',
            title: 'Minter wallet was added successfully.'
          })
          console.log(receipt)

          App.LoadLandingPage();

        } else {
          App.toast.fire({
            type: 'error',
            title: 'Error during adding minter wallet.'
          })
        }

        $('#loader').hide();
        $('#content').show();

      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })

    } else {
      App.toast.fire({
        type: 'error',
        title: 'Invalid input.'
      })
    }
  },

  saveTransferToken: function () {
    const toAddress = $('#tokenToWalletAddress').val();
    const tokenValue = $('#tokenTransferValue').val();

    if (web3.utils.isAddress(toAddress) && parseInt(tokenValue) > 0 && parseInt(tokenValue) <= App.myTokenBalance) {

      $('#loader').show();
      $('#content').hide();

      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.transfer(toAddress, tokenValue, { from: App.account });
      }).then((receipt) => {

        if (receipt.tx) {
          App.toast.fire({
            type: 'success',
            title: 'Token transfer successfully.'
          })
          console.log(receipt)

          //App.LoadLandingPage();

        } else {
          App.toast.fire({
            type: 'error',
            title: 'Error during token transfer.'
          })
        }

        $('#loader').hide();
        $('#content').show();

      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })

    } else {
      App.toast.fire({
        type: 'error',
        title: 'Invalid input.'
      })
    }
  },

  saveApprove: function () {
    const approveAddress = $('#ApproveWalletAddress').val();
    const approveValue = $('#ApproveValue').val();

    if (web3.utils.isAddress(approveAddress) && parseInt(approveValue) > 0) {

      $('#loader').show();
      $('#content').hide();

      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.approve(approveAddress, approveValue, { from: App.account });
      }).then((receipt) => {

        if (receipt.tx) {
          App.toast.fire({
            type: 'success',
            title: 'Approve successfully.'
          })
          console.log(receipt)

          //App.LoadLandingPage();

        } else {
          App.toast.fire({
            type: 'error',
            title: 'Error during approval.'
          })
        }

        $('#loader').hide();
        $('#content').show();

      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })

    } else {
      App.toast.fire({
        type: 'error',
        title: 'Invalid input.'
      })
    }
  },

  saveSetFee: function () {
    const value = $('#setFeeValue').val();

    if (parseInt(value) >= 0) {

      $('#loader').show();
      $('#content').hide();

      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.setFee(value, { from: App.account });
      }).then((receipt) => {

        if (receipt.tx) {
          App.toast.fire({
            type: 'success',
            title: 'Set fee successfully.'
          })
          console.log(receipt)

          //App.LoadLandingPage();

        } else {
          App.toast.fire({
            type: 'error',
            title: 'Error during fee setup.'
          })
        }

        $('#loader').hide();
        $('#content').show();

      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })

    } else {
      App.toast.fire({
        type: 'error',
        title: 'Invalid input.'
      })
    }
  },

  saveAllowanceTokenTransfer: function(){
    const address = $('#allowTokenToWalletAddress').val(); 
    const value = $('#allowTokenTransferValue').val();

    if (web3.utils.isAddress(address) && parseInt(value) >= 0) {

      $('#loader').show();
      $('#content').hide();

      App.contracts.tokenInstance.deployed().then(function (instance) {
        tokenInstance = instance;
        return tokenInstance.transferFrom(App.owner, address, value, { from: App.account });
      }).then((receipt) => {

        if (receipt.tx) {
          App.toast.fire({
            type: 'success',
            title: 'Allowance token transfer successfully.'
          })
          console.log(receipt)

          //App.LoadLandingPage();

        } else {
          App.toast.fire({
            type: 'error',
            title: 'Error allowance token transfer.'
          })
        }

        $('#loader').hide();
        $('#content').show();

      }).catch((error) => {
        App.toast.fire({
          type: 'error',
          title: error.message
        })
        console.error("--Error--", error)
      })

    } else {
      App.toast.fire({
        type: 'error',
        title: 'Invalid input.'
      })
    }
  },

}

$(function () {
  $(window).load(function () {
    App.init();
  })
});
