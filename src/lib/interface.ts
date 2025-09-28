import model from '@/models/tree_model.json';

// --- Type Definitions for our Model and Input ---
// This tells TypeScript the exact "shape" of our JSON model file.
type TreeNode = {
    feature?: string;
    threshold?: number;
    left?: TreeNode;
    right?: TreeNode;
    value?: number;
};

// This defines the one-hot encoded object that our model expects as input.
type FeatureInput = {
    [key: string]: number; // e.g., { "region_IN": 1, "material_Aluminium": 1, ... }
};

/**
 * Traverses the JSON decision tree to predict a recycling rate.
 * @param input A one-hot encoded feature object.
 * @returns The predicted recycling rate (a number between 0 and 1), or null if prediction fails.
 */
export function predictRecyclingRate(input: FeatureInput): number | null {
    let node: TreeNode = model;

    // Keep traversing the tree as long as we are on a decision node (which has a 'feature').
    while (node.value === undefined) {
        // Safety check: Ensure the node and input are valid.
        if (!node.feature || input[node.feature] === undefined || node.threshold === undefined) {
            console.error("Model traversal error: Feature not found in input or malformed tree node.", { feature: node.feature });
            return null;
        }

        // The core decision logic of the tree.
        if (input[node.feature] <= node.threshold) {
            node = node.left as TreeNode; // Go left if the condition is met
        } else {
            node = node.right as TreeNode; // Go right if not
        }
    }

    // Once the loop finishes, we are at a leaf node with a 'value'.
    return node.value;
}

/**
 * A helper function to convert user-friendly inputs into the one-hot encoded
 * format required by the prediction model.
 * @param material e.g., "Aluminium"
 * @param productType e.g., "Beverage Can"
 * @param region e.g., "IN"
 * @returns A FeatureInput object for the model.
 */
export function createModelInput(material: string, productType: string, region: string): FeatureInput {
    // CRITICAL: This list of all possible features MUST EXACTLY MATCH
    // the columns created by the pandas `get_dummies()` function in the Python script.
    const all_features = [
        'material_Aluminium', 'material_Copper',
        'product_type_Automotive Components', 'product_type_Beverage Can',
        'product_type_Building Construction', 'product_type_Cookware',
        'product_type_Electronics (PCB)', 'product_type_Industrial Cable',
        'product_type_Packaging Foil',
        'region_EU', 'region_IN', 'region_NA', 'region_SEA'
    ];

    const input: FeatureInput = {};
    // Initialize all possible features to 0 (false).
    all_features.forEach(f => input[f] = 0);

    // Now, construct the specific feature keys from the function arguments.
    const material_key = `material_${material}`;
    // --- THIS IS THE CORRECTED LINE ---
    const product_type_key = `product_type_${productType}`; // We no longer replace spaces with underscores.
    const region_key = `region_${region}`;

    // Set the features that are true for this specific input to 1.
    if(input.hasOwnProperty(material_key)) input[material_key] = 1;
    if(input.hasOwnProperty(product_type_key)) input[product_type_key] = 1;
    if(input.hasOwnProperty(region_key)) input[region_key] = 1;

    return input;
}