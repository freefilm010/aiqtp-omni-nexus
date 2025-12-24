/**
 * Machine Learning Engine - Comprehensive ML/AI for Quantitative Trading
 * Features: Neural Networks, Random Forests, Gradient Boosting, LSTM patterns
 */

export interface MLModel {
  id: string;
  name: string;
  type: MLModelType;
  hyperparameters: Record<string, number | string | boolean>;
  performance: ModelPerformance;
  isTraining: boolean;
  lastTrained: Date | null;
}

export type MLModelType = 
  | 'linear_regression'
  | 'ridge_regression'
  | 'lasso_regression'
  | 'elastic_net'
  | 'random_forest'
  | 'gradient_boosting'
  | 'xgboost'
  | 'lightgbm'
  | 'neural_network'
  | 'lstm'
  | 'transformer'
  | 'svm'
  | 'knn'
  | 'naive_bayes'
  | 'decision_tree'
  | 'ensemble';

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number;
  mae: number;
  r2Score: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  earlyStopping: boolean;
  patience: number;
  regularization: 'l1' | 'l2' | 'elastic' | 'none';
  dropout: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop' | 'adagrad';
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  type: 'positive' | 'negative' | 'neutral';
}

export interface Prediction {
  timestamp: Date;
  predictedValue: number;
  confidence: number;
  direction: 'up' | 'down' | 'neutral';
  actualValue?: number;
}

// ============= Neural Network Implementation =============

export class NeuralNetwork {
  private layers: number[];
  private weights: number[][][];
  private biases: number[][];
  private learningRate: number;

  constructor(layers: number[], learningRate: number = 0.01) {
    this.layers = layers;
    this.learningRate = learningRate;
    this.weights = [];
    this.biases = [];
    this.initializeWeights();
  }

  private initializeWeights(): void {
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layerWeights: number[][] = [];
      const layerBiases: number[] = [];
      
      for (let j = 0; j < this.layers[i + 1]; j++) {
        const neuronWeights: number[] = [];
        for (let k = 0; k < this.layers[i]; k++) {
          // Xavier initialization
          neuronWeights.push((Math.random() - 0.5) * Math.sqrt(2 / this.layers[i]));
        }
        layerWeights.push(neuronWeights);
        layerBiases.push(0);
      }
      
      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
    }
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  private sigmoidDerivative(x: number): number {
    const sig = this.sigmoid(x);
    return sig * (1 - sig);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  forward(input: number[]): number[] {
    let activation = input;
    
    for (let layer = 0; layer < this.weights.length; layer++) {
      const newActivation: number[] = [];
      
      for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
        let sum = this.biases[layer][neuron];
        for (let weight = 0; weight < this.weights[layer][neuron].length; weight++) {
          sum += activation[weight] * this.weights[layer][neuron][weight];
        }
        // Use ReLU for hidden layers, sigmoid for output
        newActivation.push(layer === this.weights.length - 1 ? this.sigmoid(sum) : this.relu(sum));
      }
      
      activation = newActivation;
    }
    
    return activation;
  }

  train(inputs: number[][], targets: number[][], epochs: number): { loss: number; accuracy: number }[] {
    const history: { loss: number; accuracy: number }[] = [];
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      let correct = 0;
      
      for (let i = 0; i < inputs.length; i++) {
        const output = this.forward(inputs[i]);
        const target = targets[i];
        
        // Calculate loss
        for (let j = 0; j < output.length; j++) {
          totalLoss += Math.pow(target[j] - output[j], 2);
        }
        
        // Simple accuracy for classification
        const predictedClass = output.indexOf(Math.max(...output));
        const targetClass = target.indexOf(Math.max(...target));
        if (predictedClass === targetClass) correct++;
        
        // Backpropagation (simplified)
        this.backpropagate(inputs[i], target);
      }
      
      history.push({
        loss: totalLoss / inputs.length,
        accuracy: correct / inputs.length
      });
    }
    
    return history;
  }

  private backpropagate(input: number[], target: number[]): void {
    // Forward pass with caching
    const activations: number[][] = [input];
    const zValues: number[][] = [];
    
    let activation = input;
    for (let layer = 0; layer < this.weights.length; layer++) {
      const z: number[] = [];
      const newActivation: number[] = [];
      
      for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
        let sum = this.biases[layer][neuron];
        for (let weight = 0; weight < this.weights[layer][neuron].length; weight++) {
          sum += activation[weight] * this.weights[layer][neuron][weight];
        }
        z.push(sum);
        newActivation.push(layer === this.weights.length - 1 ? this.sigmoid(sum) : this.relu(sum));
      }
      
      zValues.push(z);
      activations.push(newActivation);
      activation = newActivation;
    }
    
    // Backward pass
    const output = activations[activations.length - 1];
    let delta = output.map((o, i) => (o - target[i]) * this.sigmoidDerivative(zValues[zValues.length - 1][i]));
    
    for (let layer = this.weights.length - 1; layer >= 0; layer--) {
      const newDelta: number[] = [];
      
      for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
        for (let weight = 0; weight < this.weights[layer][neuron].length; weight++) {
          const gradient = delta[neuron] * activations[layer][weight];
          this.weights[layer][neuron][weight] -= this.learningRate * gradient;
        }
        this.biases[layer][neuron] -= this.learningRate * delta[neuron];
      }
      
      if (layer > 0) {
        for (let j = 0; j < this.weights[layer - 1][0].length; j++) {
          let sum = 0;
          for (let k = 0; k < this.weights[layer].length; k++) {
            sum += delta[k] * this.weights[layer][k][j];
          }
          newDelta.push(sum * this.reluDerivative(zValues[layer - 1][j]));
        }
        delta = newDelta;
      }
    }
  }
}

// ============= Random Forest Implementation =============

export class RandomForest {
  private trees: DecisionTree[];
  private numTrees: number;
  private maxDepth: number;
  private minSamplesSplit: number;

  constructor(numTrees: number = 100, maxDepth: number = 10, minSamplesSplit: number = 2) {
    this.trees = [];
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: number[]): void {
    this.trees = [];
    
    for (let i = 0; i < this.numTrees; i++) {
      // Bootstrap sampling
      const sampleIndices = this.bootstrapSample(X.length);
      const sampleX = sampleIndices.map(idx => X[idx]);
      const sampleY = sampleIndices.map(idx => y[idx]);
      
      const tree = new DecisionTree(this.maxDepth, this.minSamplesSplit);
      tree.fit(sampleX, sampleY);
      this.trees.push(tree);
    }
  }

  predict(X: number[]): number {
    const predictions = this.trees.map(tree => tree.predict(X));
    
    // Majority vote for classification / average for regression
    const sum = predictions.reduce((a, b) => a + b, 0);
    return sum / predictions.length > 0.5 ? 1 : 0;
  }

  predictProba(X: number[]): number {
    const predictions = this.trees.map(tree => tree.predict(X));
    return predictions.reduce((a, b) => a + b, 0) / predictions.length;
  }

  private bootstrapSample(n: number): number[] {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      indices.push(Math.floor(Math.random() * n));
    }
    return indices;
  }

  getFeatureImportance(): number[] {
    const importance: number[] = [];
    // Aggregate feature importance from all trees
    if (this.trees.length > 0) {
      const numFeatures = this.trees[0].getFeatureImportance().length;
      for (let i = 0; i < numFeatures; i++) {
        let sum = 0;
        for (const tree of this.trees) {
          const treeImportance = tree.getFeatureImportance();
          if (treeImportance[i] !== undefined) {
            sum += treeImportance[i];
          }
        }
        importance.push(sum / this.trees.length);
      }
    }
    return importance;
  }
}

// ============= Decision Tree Implementation =============

interface TreeNode {
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number;
  impurity?: number;
}

export class DecisionTree {
  private root: TreeNode | null = null;
  private maxDepth: number;
  private minSamplesSplit: number;
  private featureImportances: number[] = [];

  constructor(maxDepth: number = 10, minSamplesSplit: number = 2) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: number[]): void {
    this.featureImportances = new Array(X[0]?.length || 0).fill(0);
    this.root = this.buildTree(X, y, 0);
  }

  predict(X: number[]): number {
    if (!this.root) return 0;
    return this.traverse(this.root, X);
  }

  private traverse(node: TreeNode, X: number[]): number {
    if (node.value !== undefined) {
      return node.value;
    }
    
    if (node.featureIndex !== undefined && node.threshold !== undefined) {
      if (X[node.featureIndex] <= node.threshold) {
        return node.left ? this.traverse(node.left, X) : 0;
      } else {
        return node.right ? this.traverse(node.right, X) : 0;
      }
    }
    
    return 0;
  }

  private buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const numSamples = y.length;
    const numClasses = [...new Set(y)].length;
    
    // Stopping criteria
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || numClasses === 1) {
      const sum = y.reduce((a, b) => a + b, 0);
      return { value: sum / numSamples };
    }
    
    // Find best split
    const { featureIndex, threshold, impurity } = this.findBestSplit(X, y);
    
    if (featureIndex === -1) {
      const sum = y.reduce((a, b) => a + b, 0);
      return { value: sum / numSamples };
    }
    
    // Update feature importance
    this.featureImportances[featureIndex] += impurity;
    
    // Split data
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];
    
    for (let i = 0; i < X.length; i++) {
      if (X[i][featureIndex] <= threshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    }
    
    const leftX = leftIndices.map(i => X[i]);
    const leftY = leftIndices.map(i => y[i]);
    const rightX = rightIndices.map(i => X[i]);
    const rightY = rightIndices.map(i => y[i]);
    
    return {
      featureIndex,
      threshold,
      impurity,
      left: leftX.length > 0 ? this.buildTree(leftX, leftY, depth + 1) : { value: y.reduce((a, b) => a + b, 0) / y.length },
      right: rightX.length > 0 ? this.buildTree(rightX, rightY, depth + 1) : { value: y.reduce((a, b) => a + b, 0) / y.length }
    };
  }

  private findBestSplit(X: number[][], y: number[]): { featureIndex: number; threshold: number; impurity: number } {
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestImpurity = Infinity;
    
    const numFeatures = X[0]?.length || 0;
    
    for (let feature = 0; feature < numFeatures; feature++) {
      const thresholds = [...new Set(X.map(row => row[feature]))].sort((a, b) => a - b);
      
      for (const threshold of thresholds) {
        const leftY: number[] = [];
        const rightY: number[] = [];
        
        for (let i = 0; i < X.length; i++) {
          if (X[i][feature] <= threshold) {
            leftY.push(y[i]);
          } else {
            rightY.push(y[i]);
          }
        }
        
        if (leftY.length === 0 || rightY.length === 0) continue;
        
        const impurity = this.calculateGiniImpurity(leftY, rightY);
        
        if (impurity < bestImpurity) {
          bestImpurity = impurity;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }
    
    return { featureIndex: bestFeature, threshold: bestThreshold, impurity: bestImpurity };
  }

  private calculateGiniImpurity(left: number[], right: number[]): number {
    const gini = (arr: number[]) => {
      const n = arr.length;
      if (n === 0) return 0;
      const p1 = arr.filter(v => v === 1).length / n;
      return 1 - (p1 * p1) - ((1 - p1) * (1 - p1));
    };
    
    const total = left.length + right.length;
    return (left.length / total) * gini(left) + (right.length / total) * gini(right);
  }

  getFeatureImportance(): number[] {
    const sum = this.featureImportances.reduce((a, b) => a + b, 0);
    return sum > 0 ? this.featureImportances.map(i => i / sum) : this.featureImportances;
  }
}

// ============= Gradient Boosting Implementation =============

export class GradientBoosting {
  private trees: DecisionTree[];
  private learningRate: number;
  private numEstimators: number;
  private maxDepth: number;

  constructor(numEstimators: number = 100, learningRate: number = 0.1, maxDepth: number = 3) {
    this.trees = [];
    this.learningRate = learningRate;
    this.numEstimators = numEstimators;
    this.maxDepth = maxDepth;
  }

  fit(X: number[][], y: number[]): void {
    this.trees = [];
    
    // Initial prediction (mean)
    const mean = y.reduce((a, b) => a + b, 0) / y.length;
    let predictions = new Array(y.length).fill(mean);
    
    for (let i = 0; i < this.numEstimators; i++) {
      // Calculate residuals
      const residuals = y.map((yi, idx) => yi - predictions[idx]);
      
      // Fit tree to residuals
      const tree = new DecisionTree(this.maxDepth, 2);
      tree.fit(X, residuals);
      this.trees.push(tree);
      
      // Update predictions
      predictions = predictions.map((pred, idx) => 
        pred + this.learningRate * tree.predict(X[idx])
      );
    }
  }

  predict(X: number[]): number {
    if (this.trees.length === 0) return 0;
    
    let prediction = 0;
    for (const tree of this.trees) {
      prediction += this.learningRate * tree.predict(X);
    }
    
    return prediction > 0.5 ? 1 : 0;
  }

  predictProba(X: number[]): number {
    if (this.trees.length === 0) return 0.5;
    
    let prediction = 0;
    for (const tree of this.trees) {
      prediction += this.learningRate * tree.predict(X);
    }
    
    // Sigmoid transformation
    return 1 / (1 + Math.exp(-prediction));
  }
}

// ============= K-Nearest Neighbors =============

export class KNearestNeighbors {
  private k: number;
  private X: number[][] = [];
  private y: number[] = [];

  constructor(k: number = 5) {
    this.k = k;
  }

  fit(X: number[][], y: number[]): void {
    this.X = X;
    this.y = y;
  }

  predict(X: number[]): number {
    const distances: { distance: number; label: number }[] = [];
    
    for (let i = 0; i < this.X.length; i++) {
      const distance = this.euclideanDistance(X, this.X[i]);
      distances.push({ distance, label: this.y[i] });
    }
    
    distances.sort((a, b) => a.distance - b.distance);
    
    const kNearest = distances.slice(0, this.k);
    const votes = kNearest.reduce((acc, curr) => acc + curr.label, 0);
    
    return votes / this.k > 0.5 ? 1 : 0;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, ai, i) => sum + Math.pow(ai - b[i], 2), 0));
  }
}

// ============= Support Vector Machine (Simplified) =============

export class SupportVectorMachine {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number;
  private regularization: number;
  private epochs: number;

  constructor(learningRate: number = 0.001, regularization: number = 0.01, epochs: number = 1000) {
    this.learningRate = learningRate;
    this.regularization = regularization;
    this.epochs = epochs;
  }

  fit(X: number[][], y: number[]): void {
    const numFeatures = X[0]?.length || 0;
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;
    
    // Convert labels to {-1, 1}
    const labels = y.map(yi => yi === 1 ? 1 : -1);
    
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      for (let i = 0; i < X.length; i++) {
        const condition = labels[i] * (this.dotProduct(X[i], this.weights) + this.bias);
        
        if (condition >= 1) {
          // Correct classification
          this.weights = this.weights.map((w, j) => 
            w - this.learningRate * (2 * this.regularization * w)
          );
        } else {
          // Misclassification
          this.weights = this.weights.map((w, j) => 
            w - this.learningRate * (2 * this.regularization * w - labels[i] * X[i][j])
          );
          this.bias -= this.learningRate * (-labels[i]);
        }
      }
    }
  }

  predict(X: number[]): number {
    const result = this.dotProduct(X, this.weights) + this.bias;
    return result >= 0 ? 1 : 0;
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  }
}

// ============= Model Factory =============

export function createModel(type: MLModelType, config?: Partial<TrainingConfig>): any {
  switch (type) {
    case 'neural_network':
      return new NeuralNetwork([10, 32, 16, 1], config?.learningRate || 0.01);
    case 'random_forest':
      return new RandomForest(100, 10, 2);
    case 'gradient_boosting':
      return new GradientBoosting(100, config?.learningRate || 0.1, 3);
    case 'knn':
      return new KNearestNeighbors(5);
    case 'svm':
      return new SupportVectorMachine(0.001, 0.01, 1000);
    case 'decision_tree':
      return new DecisionTree(10, 2);
    default:
      return new NeuralNetwork([10, 32, 16, 1], 0.01);
  }
}

// ============= Cross Validation =============

export function kFoldCrossValidation(
  X: number[][],
  y: number[],
  k: number,
  modelType: MLModelType
): { mean: number; std: number; scores: number[] } {
  const foldSize = Math.floor(X.length / k);
  const scores: number[] = [];
  
  for (let fold = 0; fold < k; fold++) {
    const testStart = fold * foldSize;
    const testEnd = testStart + foldSize;
    
    const trainX = [...X.slice(0, testStart), ...X.slice(testEnd)];
    const trainY = [...y.slice(0, testStart), ...y.slice(testEnd)];
    const testX = X.slice(testStart, testEnd);
    const testY = y.slice(testStart, testEnd);
    
    const model = createModel(modelType);
    model.fit(trainX, trainY);
    
    let correct = 0;
    for (let i = 0; i < testX.length; i++) {
      const pred = model.predict(testX[i]);
      if ((pred > 0.5 ? 1 : 0) === testY[i]) correct++;
    }
    
    scores.push(correct / testX.length);
  }
  
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const std = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length);
  
  return { mean, std, scores };
}

// ============= Feature Scaling =============

export function standardize(data: number[][]): { scaled: number[][]; mean: number[]; std: number[] } {
  const numFeatures = data[0]?.length || 0;
  const mean: number[] = [];
  const std: number[] = [];
  
  for (let j = 0; j < numFeatures; j++) {
    const column = data.map(row => row[j]);
    const colMean = column.reduce((a, b) => a + b, 0) / column.length;
    const colStd = Math.sqrt(column.reduce((sum, val) => sum + Math.pow(val - colMean, 2), 0) / column.length);
    mean.push(colMean);
    std.push(colStd || 1);
  }
  
  const scaled = data.map(row => 
    row.map((val, j) => (val - mean[j]) / std[j])
  );
  
  return { scaled, mean, std };
}

export function normalize(data: number[][]): { normalized: number[][]; min: number[]; max: number[] } {
  const numFeatures = data[0]?.length || 0;
  const min: number[] = [];
  const max: number[] = [];
  
  for (let j = 0; j < numFeatures; j++) {
    const column = data.map(row => row[j]);
    min.push(Math.min(...column));
    max.push(Math.max(...column));
  }
  
  const normalized = data.map(row => 
    row.map((val, j) => (max[j] - min[j]) !== 0 ? (val - min[j]) / (max[j] - min[j]) : 0)
  );
  
  return { normalized, min, max };
}
