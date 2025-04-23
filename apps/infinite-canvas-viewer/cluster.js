import { kmeans } from 'ml-kmeans'

export function cluster(items) {
    // expects: 
    //  items[0].embedding
    //  items[0].content
    //  items[0].id
    const vectors = items.map(item => {
        return JSON.parse(item.embedding)
    })

    const numberOfClusters = 300;
    const clusteringResult = kmeans(vectors, numberOfClusters);
    const clusters = getOriginalDataBuckets(clusteringResult, items)
    return clusters
}

function getOriginalDataBuckets(clusteringResult, originalDataItems) {
	const clusters = clusteringResult.clusters
	const clusterMap = {}
	for (let i = 0 ; i < clusters.length; i++) {
		const label = clusters[i]
		const item = originalDataItems[i]
		if (clusterMap[label] == undefined) clusterMap[label] = []
		clusterMap[label].push(item.content)
	}

	return Object.values(clusterMap)
}


function calculateSSE(vectors, centroids, clusterLabels) {
	let sse = 0;
  
	vectors.forEach((vector, index) => {
	  const centroid = centroids[clusterLabels[index]]; // Find the corresponding centroid for the cluster
	  const distanceSquared = vector.reduce(
		(sum, value, i) => sum + Math.pow(value - centroid[i], 2),
		0
	  ); // Calculate squared Euclidean distance
	  sse += distanceSquared;
	});
  
	return sse;
  }

async function determineOptimalClusters(vectors, maxClusters) {
	const sseList = [];

	for (let k = 1; k <= maxClusters; k++) {
		const result = kmeans(vectors, k);
		const sse = calculateSSE(vectors, result.centroids, result.clusters)
		console.log({ clusterSize: k, error: sse })
		sseList.push(sse);
	}

	return sseList; // Choose the optimal k visually or programmatically
}