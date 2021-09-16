const DataGen = artifacts.require('./DataGen.sol');
const {
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

require('chai').should();

contract('DataGen', accounts => {
    beforeEach(async function() {
        this.token = await DataGen.deployed();
    });

    describe('Initialise DataGen attributes', function() {
        it('has the correct name', async function () {
            const name = await this.token.name();
            name.should.equal('DataGen');
        });
        it('has the correct symbol', async function() {
            const symbol = await this.token.symbol();
            symbol.should.equal('#DG');
        });
        it('has the correct decimals', async function() {
            const decimals = await this.token.decimals();
            decimals.toString().should.equal('18');
        });
        it('has the correct total supply', async function() {
            const totalSupply = await this.token.totalSupply();
            totalSupply.toString().should.equal('15000000000000000000000000') // 15M * 10^18
        });
        it('has the correct initial owner balance', async function() {
            const ownerBalance = await this.token.balanceOf(accounts[0])
            ownerBalance.toString().should.equal('15000000000000000000000000')
        });
    });

    describe('Transfer DataGen', function() {
        it('transfer 100 DG from owner account to account 1', async function() {
            await this.token.transfer(accounts[1], 100, {from: accounts[0]})
            const account1Balance = await this.token.balanceOf(accounts[1]);
            const account0Balance = await this.token.balanceOf(accounts[0]);
            account0Balance.toString().should.equal('14999999999999999999999900')
            account1Balance.toString().should.equal('100')
        });
        // it('has to revert if sender is zero address', async function() {
        //     await expectRevert(
        //         this.token.transfer(accounts[1], 100, {from: constants.ZERO_ADDRESS}),
        //         'ERC20: transfer from the zero address',
        //     );
        // });
        it('has to revert if recipient is zero address', async function() {
            await expectRevert(
                this.token.transfer(constants.ZERO_ADDRESS, 100, {from: accounts[0]}),
                'ERC20: transfer to the zero address',
            );
        });
        it('has to revert if amount exceeds balance', async function() {
            await expectRevert(
                this.token.transfer(accounts[1], constants.MAX_INT256 , {from: accounts[0]}),
                'ERC20: transfer amount exceeds balance',
            );
        });
        it('has to emit a Transfer event for a valid transaction', async function() {
            const receipt = await this.token.transfer(accounts[1], 100, {from: accounts[0]});     
            await expectEvent(receipt, 'Transfer', {
                from: accounts[0],
                to: accounts[1],
                value: '100',
            });
        });
    });
    
    describe('Transfer DataGen with approval', async function() {
        it('with not approve must be 0 allowance', async function() {
            const allowanceAccount1 = await this.token.allowance(accounts[0], accounts[1]);
            allowanceAccount1.toString().should.equal('0');
        });
        it('has to have 100 DG allowance if approved', async function() {
            await this.token.approve(accounts[1], 100);
            const allowanceAccount1 = await this.token.allowance(accounts[0], accounts[1]);
            allowanceAccount1.toString().should.equal('100');
        });
        // it('has to revert if approve from zero address', async function() {
        //     await expectRevert(
        //         this.token.approve(accounts[1], 100, {from: constants.ZERO_ADDRESS}),
        //         'ERC20: approve from the zero address'
        //     )
        // });
        it('has to revert if spender is zero address', async function() {
            await expectRevert(
                this.token.approve(constants.ZERO_ADDRESS, 100),
                'ERC20: approve to the zero address'
            );
        });
        it('has to emit a Approval event if correct approved', async function() {
            const receipt = await this.token.approve(accounts[1], 100);
            await expectEvent(receipt, 'Approval', {
                owner: accounts[0],
                spender: accounts[1],
                value: '100',
            });
        });
        it('has to transfer 100 DG from owner if approved', async function() {
            //accounts[1] is the spender, approved 100 DG from ownerv (accounts[0]) and transfer 100 DG to accounts[2]
            await this.token.approve(accounts[1], 100, {from: accounts[0]});
            await this.token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
            const account2Balance = await this.token.balanceOf(accounts[2]);
            account2Balance.toString().should.equal('100');
        });
        it('has to emit a correct Tranfer event', async function() {
            await this.token.approve(accounts[1], 100, {from: accounts[0]});
            const receipt = await this.token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
            await expectEvent(receipt, 'Transfer', {
                from: accounts[0],
                to: accounts[2],
                value: '100',
            });
        });
        it('has to revert if transfer amount exceeds allowance', async function() {
            await this.token.approve(accounts[1], 100, {from: accounts[0]});
            await expectRevert(
                this.token.transferFrom(accounts[0], accounts[2], 101, {from: accounts[1]}),
                'ERC20: transfer amount exceeds allowance'
            );
        });
        it('has to increse allowance', async function() {
            await this.token.increaseAllowance(accounts[1], 100, {from: accounts[0]});
            const account1Allowance = await this.token.allowance(accounts[0], accounts[1]);
            account1Allowance.toString().should.equal('100');
        });
        it('has to decrease allowance', async function() {
            await this.token.increaseAllowance(accounts[1], 100, {from: accounts[0]});
            await this.token.decreaseAllowance(accounts[1], 50, {from: accounts[0]});
            const account1Allowance = await this.token.allowance(accounts[0], accounts[1]);
            account1Allowance.toString().should.equal('50');
        });
    });

    describe('Mint DataGen', async function() {
        it('has to revert if mint to the zero address', async function() {
            await expectRevert(
                this.token.mint(constants.ZERO_ADDRESS, 100, {from: accounts[0]}),
                'ERC20: mint to the zero address'
            );
        });
        it('has to revert if minting is finished', async function() {
            await this.token.mint(accounts[1], constants.MAX_UINT256);
            await expectRevert(
                this.token.mint(accounts[1], 1),
                'Minting is Finished.'
            );
        });
        it('has to increse total supply by 100 DG', async function() {
            await this.token.mint(accounts[1], 100);
            const totalSupply = await this.token.totalSupply();
            totalSupply.toString().should.equal('15000000000000000000000100');
        });
        it('has to increse account balance by 100 DG', async function() {
            await this.token.mint(accounts[1], 100);
            const account1Balance = await this.token.balanceOf(accounts[1]);
            account1Balance.toString().should.equal('100');
        });
        it('has to emit a Transfer event', async function() {
            const receipt = await this.token.mint(accounts[1], 100);
            await expectEvent(receipt, 'Transfer', {
                from: constants.ZERO_ADDRESS,
                to: accounts[1],
                value: '100',
            });
        });
    });

    describe('Burn DataGen', async function() {
        it('has to revert if burn from zero address', async function() {
            await expectRevert(
                this.token.burn(constants.ZERO_ADDRESS, 100),
                'ERC20: burn from the zero address'
            );
        });
        it('has to revert if burn amount exceeds balance', async function() {
            await expectRevert(
                this.token.burn(accounts[1], 100),
                'ERC20: burn amount exceeds balance'
            );
        });
        it('has to decrease account balance by 100 DG', async function() {
            await this.token.burn(accounts[0], 100);
            const account0Balance = await this.token.balanceOf(accounts[0]);
            account0Balance.toString().should.equal('14999999999999999999999900');
        });
        it('has to decrease total supply by 100 DG', async function() {
            await this.token.burn(accounts[0], 100);
            const totalSupply = await this.token.totalSupply();
            totalSupply.toString().should.equal('14999999999999999999999900');
        });
        it('has to emit Transfer event', async function() {
            const receipt = await this.token.burn(accounts[0], 100);
            await expectEvent(receipt, 'Transfer', {
                from: accounts[0],
                to: constants.ZERO_ADDRESS,
                value: '100',
            });
        });
    });
});