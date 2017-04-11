'use strict';

function ManagerUtils() {};

ManagerUtils.calculateBuildingPositionMatrix = function(neoBuilding) {
	var metaData = neoBuilding.metaData;
	if( metaData == undefined
			|| metaData.longitude == undefined 
			|| metaData.latitude == undefined 
			|| metaData.altitude == undefined ) return false;
	
	// 0) PositionMatrix.************************************************************************
	var position;
	if(neoBuilding.buildingPosition != undefined)
	{
		position = neoBuilding.buildingPosition;
	}
	else
	{
		position = Cesium.Cartesian3.fromDegrees(metaData.longitude, metaData.latitude, metaData.altitude);
	}
	neoBuilding.buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	//var splitValue = Cesium.EncodedCartesian3.encode(position); // no works.***
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	neoBuilding.buildingPositionHIGH = new Float32Array(3);
	neoBuilding.buildingPositionHIGH[0] = splitVelue_X.high;
	neoBuilding.buildingPositionHIGH[1] = splitVelue_Y.high;
	neoBuilding.buildingPositionHIGH[2] = splitVelue_Z.high;
	
	neoBuilding.buildingPositionLOW = new Float32Array(3);
	neoBuilding.buildingPositionLOW[0] = splitVelue_X.low;
	neoBuilding.buildingPositionLOW[1] = splitVelue_Y.low;
	neoBuilding.buildingPositionLOW[2] = splitVelue_Z.low;
	
	// Determine the elevation of the position.***********************************************************
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    //var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	neoBuilding.move_matrix = new Float32Array(16); // PositionMatrix.***
	neoBuilding.move_matrix_inv = new Float32Array(16); // Inverse of PositionMatrix.***
	neoBuilding.transfMat = new Matrix4();
	neoBuilding.transfMatInv = new Matrix4();
	Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, neoBuilding.move_matrix);
	neoBuilding.transfMat.setByFloat32Array(neoBuilding.move_matrix);
	neoBuilding.transfMat_inv = new Float32Array(16);
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.transfMat_inv);
	
	neoBuilding.move_matrix[12] = 0;
	neoBuilding.move_matrix[13] = 0;
	neoBuilding.move_matrix[14] = 0;
	neoBuilding.buildingPosition = position;
	// note: "neoBuilding.move_matrix" is only rotation matrix.***
	
	Cesium.Matrix4.inverse(neoBuilding.move_matrix, neoBuilding.move_matrix_inv);
	neoBuilding.transfMatInv.setByFloat32Array(neoBuilding.move_matrix_inv);
	
	return true;
};

ManagerUtils.calculateGeoLocationData = function(longitude, latitude, altitude, heading, pitch, roll, resultGeoLocationData) {
	
	if(resultGeoLocationData == undefined) resultGeoLocationData = new GeoLocationData();
	
	// 0) Position.********************************************************************************************

	if(longitude != undefined)
		resultGeoLocationData.longitude = longitude;
	
	if(latitude != undefined)
		resultGeoLocationData.latitude = latitude;
	
	if(altitude != undefined)
		resultGeoLocationData.elevation = altitude;
	
	if(heading != undefined)
		resultGeoLocationData.heading = heading;
	
	if(pitch != undefined)
		resultGeoLocationData.pitch = pitch;
	
	if(roll != undefined)
		resultGeoLocationData.roll = roll;
	
	if(resultGeoLocationData.longitude == undefined || resultGeoLocationData.latitude == undefined)
		return;
	
	resultGeoLocationData.position = Cesium.Cartesian3.fromDegrees(resultGeoLocationData.longitude, resultGeoLocationData.latitude, resultGeoLocationData.elevation);
	
	// High and Low values of the position.********************************************************************
	//var splitValue = Cesium.EncodedCartesian3.encode(position); // no works.***
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(resultGeoLocationData.position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(resultGeoLocationData.position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(resultGeoLocationData.position.z);
	
	resultGeoLocationData.positionHIGH = new Float32Array([splitVelue_X.high, splitVelue_Y.high, splitVelue_Z.high]);
	resultGeoLocationData.positionLOW = new Float32Array([splitVelue_X.low, splitVelue_Y.low, splitVelue_Z.low]);
	
	// Determine the elevation of the position.***********************************************************
	//var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    //var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	if(resultGeoLocationData.tMatrix == undefined)
		resultGeoLocationData.tMatrix = new Matrix4();
	else
		resultGeoLocationData.tMatrix.Identity();
	
	if(resultGeoLocationData.geoLocMatrix == undefined)
		resultGeoLocationData.geoLocMatrix = new Matrix4();
	else
		resultGeoLocationData.geoLocMatrix.Identity();
	
	if(resultGeoLocationData.geoLocMatrixInv == undefined)
		resultGeoLocationData.geoLocMatrixInv = new Matrix4();
	else
		resultGeoLocationData.geoLocMatrixInv.Identity();
	
	//---------------------------------------------------------
	
	if(resultGeoLocationData.tMatrixInv == undefined)
		resultGeoLocationData.tMatrixInv = new Matrix4(); 
	else
		resultGeoLocationData.tMatrixInv.Identity(); 
	
	if(resultGeoLocationData.rotMatrix == undefined)
		resultGeoLocationData.rotMatrix = new Matrix4(); 
	else
		resultGeoLocationData.rotMatrix.Identity(); 
	
	if(resultGeoLocationData.rotMatrixInv == undefined)
		resultGeoLocationData.rotMatrixInv = new Matrix4(); 
	else
		resultGeoLocationData.rotMatrixInv.Identity(); 
	
	var xRotMatrix = new Matrix4();  // created as identity matrix.***
	var yRotMatrix = new Matrix4();  // created as identity matrix.***
	var zRotMatrix = new Matrix4();  // created as identity matrix.***
	
	// test. we simulate that heading is 45 degrees.***
	//heading = 30.0;
	//pitch = 40.0;
	//roll = 125;
	
	if(resultGeoLocationData.heading != undefined && resultGeoLocationData.heading != 0)
	{
		zRotMatrix.rotationAxisAngDeg(resultGeoLocationData.heading, 0.0, 0.0, -1.0);
	}
	
	if(resultGeoLocationData.pitch != undefined && resultGeoLocationData.pitch != 0)
	{
		xRotMatrix.rotationAxisAngDeg(resultGeoLocationData.pitch, -1.0, 0.0, 0.0);
	}
	
	if(resultGeoLocationData.roll != undefined && resultGeoLocationData.roll != 0)
	{
		yRotMatrix.rotationAxisAngDeg(resultGeoLocationData.roll, 0.0, -1.0, 0.0);
	}
	
	Cesium.Transforms.eastNorthUpToFixedFrame(resultGeoLocationData.position, undefined, resultGeoLocationData.tMatrix._floatArrays);
	resultGeoLocationData.geoLocMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	
	var zRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(resultGeoLocationData.tMatrix, zRotatedTMatrix);
	var zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
	var zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
	resultGeoLocationData.tMatrix = zxyRotatedTMatrix;
	
	resultGeoLocationData.rotMatrix.copyFromMatrix4(resultGeoLocationData.tMatrix);
	resultGeoLocationData.rotMatrix._floatArrays[12] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[13] = 0;
	resultGeoLocationData.rotMatrix._floatArrays[14] = 0;
	
	// now, calculates the inverses.***
	Cesium.Matrix4.inverse(resultGeoLocationData.tMatrix._floatArrays, resultGeoLocationData.tMatrixInv._floatArrays);
	Cesium.Matrix4.inverse(resultGeoLocationData.rotMatrix._floatArrays, resultGeoLocationData.rotMatrixInv._floatArrays);
	Cesium.Matrix4.inverse(resultGeoLocationData.geoLocMatrix._floatArrays, resultGeoLocationData.geoLocMatrixInv._floatArrays);

	return resultGeoLocationData;
};


ManagerUtils.getBuildingCurrentPosition = function(renderingMode, neoBuilding) {
	// renderingMode = 0 => assembled.***
	// renderingMode = 1 => dispersed.***
	
	if(neoBuilding == undefined) return undefined;
	
	var realBuildingPos;
	
	// 0 = assembled mode. 1 = dispersed mode.***
	if(renderingMode == 1) {
		if(neoBuilding.geoLocationDataAux == undefined) {
			var realTimeLocBlocksList = MagoConfig.getInformation().blockConfig.blocks;
			var newLocation = realTimeLocBlocksList[neoBuilding.buildingId];
			// must calculate the realBuildingPosition (bbox_center_position).***
			
			if(newLocation) {
				neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(newLocation.LONGITUDE, newLocation.LATITUDE, newLocation.ELEVATION, neoBuilding.geoLocationDataAux);
				
				//this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
				neoBuilding.point3d_scratch.set(0.0, 0.0, 50.0);
				realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
			} else {
				// use the normal data.***
				neoBuilding.point3d_scratch = neoBuilding.bbox.getCenterPoint3d(neoBuilding.point3d_scratch);
				realBuildingPos = neoBuilding.transfMat.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
			}
		} else {
			//this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
			neoBuilding.point3d_scratch.set(0.0, 0.0, 50.0);
			realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
		}
	} else {
		neoBuilding.point3d_scratch = neoBuilding.bbox.getCenterPoint3d(neoBuilding.point3d_scratch);
		realBuildingPos = neoBuilding.transfMat.transformPoint3D(neoBuilding.point3d_scratch, realBuildingPos );
	}
	
	return realBuildingPos;
};
