/**
 * @fileoverview Let users know the site is under maintenance.
 * @author Bob Kline
 * @date 2025-02-15
 */

import React from 'react';
import image from '../static/under-construction.jpg';

const MaintenanceMode = () => (
  <>
    <h1>Sorry For The Dust</h1>
    <div className="d-flex align-items-center">
      <img src={image} alt="construction worker" className="float-start me-3" />
      <p className="text-danger fs-3 ms-2">
        The Music Library Catalog site is currently undergoing
        some maintainence work.<br/> We'll be back soon!
      </p>
    </div>
  </>
);

export default MaintenanceMode;
