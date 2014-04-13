/**
 * @class AABB
 * @param [min] {vec3}
 * @param [max] {vec3}
 * @constructor
 */
Goblin.AABB = function( min, max ) {
	/**
	 * @property min
	 * @type {vec3}
	 */
	this.min = min || vec3.create();

	/**
	 * @property max
	 * @type {vec3}
	 */
	this.max = max || vec3.create();
};

Goblin.AABB.prototype.transform = (function(){
	var local_half_extents = vec3.create(),
		local_center = vec3.create(),
		center = vec3.create(),
		extents = vec3.create(),
		abs = mat3.create();

	return function( local_aabb, matrix ) {
		vec3.subtract( local_aabb.max, local_aabb.min, local_half_extents );
		vec3.scale( local_half_extents, 0.5 );

		vec3.add( local_aabb.max, local_aabb.min, local_center );
		vec3.scale( local_center, 0.5 );

		mat4.multiplyVec3( matrix, local_center, center );

		// Extract the absolute rotation matrix
		abs[0] = Math.abs( matrix[0] );
		abs[1] = Math.abs( matrix[1] );
		abs[2] = Math.abs( matrix[2] );
		abs[3] = Math.abs( matrix[4] );
		abs[4] = Math.abs( matrix[5] );
		abs[5] = Math.abs( matrix[6] );
		abs[6] = Math.abs( matrix[8] );
		abs[7] = Math.abs( matrix[9] );
		abs[8] = Math.abs( matrix[10] );

		_tmp_vec3_1[0] = abs[0];
		_tmp_vec3_1[1] = abs[1];
		_tmp_vec3_1[2] = abs[2];
		extents[0] = vec3.dot( local_half_extents, _tmp_vec3_1 );

		_tmp_vec3_1[0] = abs[3];
		_tmp_vec3_1[1] = abs[4];
		_tmp_vec3_1[2] = abs[5];
		extents[1] = vec3.dot( local_half_extents, _tmp_vec3_1 );

		_tmp_vec3_1[0] = abs[6];
		_tmp_vec3_1[1] = abs[7];
		_tmp_vec3_1[2] = abs[8];
		extents[2] = vec3.dot( local_half_extents, _tmp_vec3_1 );

		vec3.subtract( center, extents, this.min );
		vec3.add( center, extents, this.max );
	};
})();

Goblin.AABB.prototype.intersects = function( aabb ) {
    if (
        this.max[0] < aabb.min[0] ||
        this.max[1] < aabb.min[1] ||
        this.max[2] < aabb.min[2] ||
        this.min[0] > aabb.max[0] ||
        this.min[1] > aabb.max[1] ||
        this.min[2] > aabb.max[2]
    )
    {
        return false;
    }

    return true;
};

/**
 * Checks if a ray segment intersects with this AABB
 *
 * @method testRayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {boolean}
 */
Goblin.AABB.prototype.testRayIntersect = (function(){
	var direction = vec3.create(),
		tmin, tmax,
		ood, t1, t2;

	return function( start, end ) {
		tmin = 0;

		vec3.subtract( end, start, direction );
		tmax = vec3.length( direction );
		vec3.scale( direction, 1 / tmax ); // normalize direction

		for ( var i = 0; i < 3; i++ ) {
			var extent = ( i === 0 ? this.half_width : (  i === 1 ? this.half_height : this.half_depth ) );

			if ( Math.abs( direction[i] ) < Goblin.EPSILON ) {
				// Ray is parallel to axis
				if ( start[i] < -extent || start[i] > extent ) {
					return false;
				}
			} else {
				ood = 1 / direction[i];
				t1 = ( -extent - start[i] ) * ood;
				t2 = ( extent - start[i] ) * ood;
				if ( t1 > t2 ) {
					ood = t1; // ood is a convenient temp variable as it's not used again
					t1 = t2;
					t2 = ood;
				}

				// Find intersection intervals
				tmin = Math.max( tmin, t1 );
				tmax = Math.min( tmax, t2 );

				if ( tmin > tmax ) {
					return false;
				}
			}
		}

		return true;
	};
})();