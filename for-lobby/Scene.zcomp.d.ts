import { ZComponent, ContextManager, Observable, Animation, Layer, LayerClip, Event, ConstructorForComponent } from "@zcomponent/core";

import { DefaultCookieConsent as DefaultCookieConsent_0 } from "@zcomponent/core/lib/components/DefaultCookieConsent";
import { DefaultEnvironment as DefaultEnvironment_1 } from "@zcomponent/three/lib/components/environments/DefaultEnvironment";
import { DefaultLoader as DefaultLoader_2 } from "@zcomponent/core/lib/components/DefaultLoader";
import { Group as Group_3 } from "@zcomponent/three/lib/components/Group";
import { DirectionalLight as DirectionalLight_4 } from "@zcomponent/three/lib/components/lights/DirectionalLight";
import { PerspectiveCamera as PerspectiveCamera_5 } from "@zcomponent/three/lib/components/cameras/PerspectiveCamera";
import { ShadowPlane as ShadowPlane_6 } from "@zcomponent/three/lib/components/meshes/ShadowPlane";
import { Image as Image_7 } from "@zcomponent/three/lib/components/Image";
import { GLTF as GLTF_8 } from "@zcomponent/three/lib/components/models/GLTF";

interface ConstructorProps {

}

/**
* @zcomponent
* @zicon zcomponent
* @ztag zcomponent
*/
declare class Comp extends ZComponent {

	constructor(contextManager: ContextManager, constructorProps: ConstructorProps);

	nodes: {
		DefaultCookieConsent: DefaultCookieConsent_0 & {
			behaviors: {

			}
		},
		DefaultEnvironment: DefaultEnvironment_1 & {
			behaviors: {

			}
		},
		DefaultLoader: DefaultLoader_2 & {
			behaviors: {

			}
		},
		Defaults: Group_3 & {
			behaviors: {

			}
		},
		DirectionalLight: DirectionalLight_4 & {
			behaviors: {

			}
		},
		PerspectiveCamera: PerspectiveCamera_5 & {
			behaviors: {

			}
		},
		ShadowPlane: ShadowPlane_6 & {
			behaviors: {

			}
		},
		lobbymap_png: Image_7 & {
			behaviors: {

			}
		},
		Door_glb: GLTF_8 & {
			behaviors: {

			}
		},
		Door_glb_2: GLTF_8 & {
			behaviors: {

			}
		},
		Door_glb_3: GLTF_8 & {
			behaviors: {

			}
		},
		Door_glb_4: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_2: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_3: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_4: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_5: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_6: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_7: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_8: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_9: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_10: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_11: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_12: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_13: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_14: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_15: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_16: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb_2: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb_3: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb_4: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb_5: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb_6: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb_7: GLTF_8 & {
			behaviors: {

			}
		},
		Tree_Bigger_glb_8: GLTF_8 & {
			behaviors: {

			}
		},
		Bush_Classik_glb: GLTF_8 & {
			behaviors: {

			}
		},
		Bush_Classik_glb_2: GLTF_8 & {
			behaviors: {

			}
		},
		Bush_Classik_glb_3: GLTF_8 & {
			behaviors: {

			}
		},
		Bush_Classik_glb_4: GLTF_8 & {
			behaviors: {

			}
		},
		Bush_Classik_glb_5: GLTF_8 & {
			behaviors: {

			}
		},
		Bush_Classik_glb_6: GLTF_8 & {
			behaviors: {

			}
		},
		Grass_glb_17: GLTF_8 & {
			behaviors: {

			}
		},
	};

	animation: Animation & { layers: {

	}};

	/**
	 * The position, in 3D space, of this node relative to its parent. The three elements of the array correspond to the `x`, `y`, and `z` components of position.
	 * 
	 * @zprop
	 * @zdefault [0,0,0]
	 * @zgroup Transform
	 * @zgrouppriority 10
	 */
	public position: Observable<[x: number, y: number, z: number]>;

	/**
	 * The rotation, in three dimensions, of this node relative to its parent. The three elements of the array correspond to Euler angles - yaw, pitch and roll.
	 * 
	 * @zprop
	 * @zdefault [0,0,0]
	 * @zgroup Transform
	 * @zgrouppriority 10
	 */
	public rotation: Observable<[x: number, y: number, z: number]>;

	/**
	 * The scale, in three dimensions, of this node relative to its parent. The three elements of the array correspond to scales in the the `x`, `y`, and `z` axis.
	 * 
	 * @zprop
	 * @zdefault [1,1,1]
	 * @zgroup Transform
	 * @zgrouppriority 10
	 */
	public scale: Observable<[x: number, y: number, z: number]>;

	/**
	 * Determines if this object and its children are rendered to the screen.
	 * 
	 * @zprop
	 * @zdefault true
	 * @zgroup Appearance
	 * @zgrouppriority 11
	 */
	public visible: Observable<boolean>;
}

export default Comp;
