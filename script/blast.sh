#!/bin/bash
#
# Align two nucleotide sequences and return the best query and subject alignments
#
# Input: subject_sequence query_sequence
# OPTIONS
# 	-m (max sequence length)	Limit the sequence length to m nucleotides (default: 1000)
# Output: two separate lines being the alignments for query and subject, respectively
#
# Error codes:
# 	0: Success
# 	1: Wrong number of arguments
# 	2: sequence input length was greater than max allowed (set by -m, defaults to 1000 nucleotides per sequence)
#
# Author: Bremen Braun

# Process options
MAXLEN=1000
set -- $(getopt m: "$@")
while [ $# -gt 0 ]; do
	case $1 in
		(-m) MAXLEN=$2; shift;;
		(--) shift; break;;
		(*) break;;
	esac
	
	shift
done

if [ $# -ne 2 ]; then
	exit 1
fi

SUBJECTSEQUENCE=$1
QUERYSEQUENCE=$2

if [ ${#SUBJECTSEQUENCE} -gt $MAXLEN ]; then
	exit 2
fi
if [ ${#QUERYSEQUENCE} -gt $MAXLEN ]; then
	exit 2
fi

RAND=$(date +%s)
SUBJECTFILE="subject_$RAND"
QUERYFILE="query_$RAND"

# Create temporary files for sequence input
echo -e ">subject\n$SUBJECTSEQUENCE" > $SUBJECTFILE
echo -e ">query\n$QUERYSEQUENCE" > $QUERYFILE

# Run alignment and filter to first result for query and subject
blastn -subject $SUBJECTFILE -query $QUERYFILE -task blastn-short -outfmt 2 | grep '^[Query_1|Subject_1]' | awk '{print $3}' | sed '/^$/d' | head -n 2

# Clean up temporary files
rm $SUBJECTFILE
rm $QUERYFILE

exit 0