import {expect} from 'chai';
import {spec} from 'modules/kummaBidAdapter';
import {getTopWindowLocation, getTopWindowReferrer} from 'src/utils';

describe('Kumma Adapter Tests', () => {
  const slotConfigs = [{
    placementCode: '/DfpAccount1/slot1',
    sizes: [[300, 250]],
    bidId: 'bid12345',
    params: {
      pubId: '55879',
      siteId: '26047',
      placementId: '123',
      bidFloor: '0.001'
    }
  }, {
    placementCode: '/DfpAccount2/slot2',
    sizes: [[250, 250]],
    bidId: 'bid23456',
    params: {
      pubId: '55879',
      siteId: '26047',
      placementId: '456'
    }
  }];
  it('Verify build request', () => {
    const request = spec.buildRequests(slotConfigs);
    expect(request.url).to.equal('//hb.kumma.com/');
    expect(request.method).to.equal('POST');
    const ortbRequest = JSON.parse(request.data);
    // site object
    expect(ortbRequest.site).to.not.equal(null);
    expect(ortbRequest.site.publisher).to.not.equal(null);
    expect(ortbRequest.site.publisher.id).to.equal('55879');
    expect(ortbRequest.site.ref).to.equal(getTopWindowReferrer());
    expect(ortbRequest.site.page).to.equal(getTopWindowLocation().href);
    expect(ortbRequest.imp).to.have.lengthOf(2);
    // device object
    expect(ortbRequest.device).to.not.equal(null);
    expect(ortbRequest.device.ua).to.equal(navigator.userAgent);
    // slot 1
    expect(ortbRequest.imp[0].tagid).to.equal('123');
    expect(ortbRequest.imp[0].banner).to.not.equal(null);
    expect(ortbRequest.imp[0].banner.w).to.equal(300);
    expect(ortbRequest.imp[0].banner.h).to.equal(250);
    expect(ortbRequest.imp[0].bidfloor).to.equal('0.001');
    // slot 2
    expect(ortbRequest.imp[1].tagid).to.equal('456');
    expect(ortbRequest.imp[1].banner).to.not.equal(null);
    expect(ortbRequest.imp[1].banner.w).to.equal(250);
    expect(ortbRequest.imp[1].banner.h).to.equal(250);
    expect(ortbRequest.imp[1].bidfloor).to.equal('0.000001');
  });

  it('Verify parse response', () => {
    const request = spec.buildRequests(slotConfigs);
    const ortbRequest = JSON.parse(request.data);
    const ortbResponse = {
      seatbid: [{
        bid: [{
          impid: ortbRequest.imp[0].id,
          price: 1.25,
          adm: 'This is an Ad',
          adid: '471810',
        }]
      }],
      cur: 'USD'
    };
    const bids = spec.interpretResponse({ body: ortbResponse }, request);
    expect(bids).to.have.lengthOf(1);
    // verify first bid
    const bid = bids[0];
    expect(bid.cpm).to.equal(1.25);
    expect(bid.ad).to.equal('This is an Ad');
    expect(bid.width).to.equal(300);
    expect(bid.height).to.equal(250);
    expect(bid.creativeId).to.equal('471810');
    expect(bid.currency).to.equal('USD');
    expect(bid.ttl).to.equal(360);
  });

  it('Verify full passback', () => {
    const request = spec.buildRequests(slotConfigs);
    const bids = spec.interpretResponse({ body: null }, request)
    expect(bids).to.have.lengthOf(0);
  });

  it('Verifies bidder code', () => {
    expect(spec.code).to.equal('kumma');
  });

  it('Verifies if bid request valid', () => {
    expect(spec.isBidRequestValid(slotConfigs[0])).to.equal(true);
    expect(spec.isBidRequestValid({})).to.equal(false);
    expect(spec.isBidRequestValid({ params: {} })).to.equal(false);
  });
});
